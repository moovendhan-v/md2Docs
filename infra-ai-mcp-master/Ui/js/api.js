/**
 * InfraAI API client
 * Auth: Cognito Bearer token (stored in localStorage) with X-Admin-Key fallback
 */
(function () {
    // ── Config from js/config.js ──────────────────────────────────────────────
    const API_BASE_URL  = window.APP_CONFIG.API_BASE_URL;
    const MCP_SERVER_URL = window.APP_CONFIG.MCP_SERVER_URL;
    const COGNITO_CLIENT_ID = window.APP_CONFIG.COGNITO_CLIENT_ID;

    const LS_TOKEN    = 'infra_cognito_id_token';
    const LS_BASE_URL = 'infra_admin_base_url';  // kept for backward compat only

    // ── Token storage ─────────────────────────────────────────────────────────
    function getToken()    { return localStorage.getItem(LS_TOKEN); }
    function setToken(t)   { localStorage.setItem(LS_TOKEN, t); }
    function clearToken()  { localStorage.removeItem(LS_TOKEN); }

    function getBaseUrl() { return API_BASE_URL; }

    // ── Parse JWT payload (no validation — only for display) ──────────────────
    function parseJwtPayload(token) {
        try {
            return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        } catch { return {}; }
    }

    function isTokenExpired(token) {
        const p = parseJwtPayload(token);
        return p.exp ? Date.now() / 1000 > p.exp : true;
    }

    // ── Cognito OAuth PKCE helpers ────────────────────────────────────────────
    async function generateCodeChallenge() {
        const verifier = crypto.getRandomValues(new Uint8Array(32));
        const verifierStr = btoa(String.fromCharCode(...verifier)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifierStr));
        const challenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        return { verifier: verifierStr, challenge };
    }

    async function startCognitoLogin() {
        const { verifier, challenge } = await generateCodeChallenge();
        const state = crypto.randomUUID();
        sessionStorage.setItem('pkce_verifier', verifier);
        sessionStorage.setItem('oauth_state', state);

        // Redirect through our MCP server's /authorize proxy
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: COGNITO_CLIENT_ID,
            redirect_uri: window.location.origin + window.location.pathname,
            scope: 'openid email profile',
            state,
            code_challenge: challenge,
            code_challenge_method: 'S256',
        });
        window.location.href = `${MCP_SERVER_URL}/authorize?${params}`;
    }

    async function handleOAuthCallback() {
        const params   = new URLSearchParams(window.location.search);
        const code     = params.get('code');
        const state    = params.get('state');
        const storedState = sessionStorage.getItem('oauth_state');
        const verifier    = sessionStorage.getItem('pkce_verifier');

        if (!code) return false;
        console.log('[AUTH DEBUG] URL state:', state, '| Stored state:', storedState);
        if (state !== storedState) {
            console.error('[AUTH] State mismatch');
            return false;
        }

        // Exchange code for tokens via our MCP server /token proxy
        try {
            const resp = await fetch(`${MCP_SERVER_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: window.location.origin + window.location.pathname,
                    client_id: COGNITO_CLIENT_ID,
                    code_verifier: verifier,
                }),
            });
            const data = await resp.json();
            if (data.id_token) {
                setToken(data.id_token);
                // Clean URL without exposing the code
                window.history.replaceState({}, '', window.location.pathname);
                sessionStorage.removeItem('pkce_verifier');
                sessionStorage.removeItem('oauth_state');
                return true;
            } else {
                console.error('[AUTH] Token exchange failed', data);
                return false;
            }
        } catch (e) {
            console.error('[AUTH] Token exchange error', e);
            return false;
        }
    }

    function logout() {
        clearToken();
        window.location.reload();
    }

    // ── Axios instance ────────────────────────────────────────────────────────
    const api = axios.create();

    api.interceptors.request.use((config) => {
        config.baseURL = getBaseUrl();
        // Use Cognito token, fall back to tenant user token for user console
        const token = getToken() || localStorage.getItem('infra_user_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // Prepend /api to all API requests for path-based routing
        if (config.url && !config.url.startsWith('/api')) {
            config.url = '/api' + config.url;
        }
        return config;
    });

    api.interceptors.response.use(
        (response) => response.data,
        (error) => {
            if (error.response?.status === 401) {
                clearToken();
                updateAuthUI();
            }
            const msg = error.response?.data?.detail || error.message || 'API Request failed';
            console.error('[API ERROR]', msg);
            return Promise.reject(error);
        }
    );

    // ── Auth UI state ─────────────────────────────────────────────────────────
    function updateAuthUI() {
        const token     = getToken();
        const loginBtn  = document.getElementById('btnLogin');
        const logoutBtn = document.getElementById('btnLogout');
        const userLabel = document.getElementById('userLabel');
        const adminKeySection = document.getElementById('adminKeySection');

        if (token && !isTokenExpired(token)) {
            const payload = parseJwtPayload(token);
            const name    = payload.email || payload['cognito:username'] || payload.sub || 'Admin';
            if (loginBtn)  loginBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            if (userLabel) {
                const inner = userLabel.querySelector('span') || userLabel;
                inner.textContent = name;
                userLabel.classList.remove('hidden');
            }
            if (adminKeySection) adminKeySection.classList.add('hidden');
        } else {
            if (loginBtn)  loginBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
            if (userLabel) userLabel.classList.add('hidden');
            if (adminKeySection) adminKeySection.classList.remove('hidden');
        }
    }

    // ── Bootstrap ─────────────────────────────────────────────────────────────
    async function init() {
        // Restore saved base URL
        const savedBase = localStorage.getItem(LS_BASE_URL);
        const baseInput = document.getElementById('baseUrl');
        if (savedBase && baseInput) baseInput.value = savedBase;

        // Handle OAuth callback redirect (code in URL)
        const hasCode = new URLSearchParams(window.location.search).has('code');
        if (hasCode) {
            const ok = await handleOAuthCallback();
            if (!ok) alert('Login failed — please try again.');
        }

        // Check if existing token is still valid
        const token = getToken();
        if (token && isTokenExpired(token)) clearToken();

        // Perform RBAC redirection based on Cognito groups
        const activeToken = getToken();
        if (activeToken) {
            const payload = parseJwtPayload(activeToken);
            const groups = payload['cognito:groups'] || [];
            const path = window.location.pathname;

            // If on admin.html and missing 'admin' group, redirect to user console
            if (path.includes('admin.html') && !groups.includes('admin')) {
                alert("Access Denied: You must be in the 'admin' group to view this page.");
                window.location.href = 'user.html';
                return;
            }
            
            // If on index.html, auto-redirect to the appropriate dashboard
            if (path === '/' || path.includes('index.html')) {
                window.location.href = groups.includes('admin') ? 'admin.html' : 'user.html';
                return;
            }
            
            // For user.html, we assume any valid Cognito token is authorized.
        } else {
            // Not authenticated: if not on index.html, redirect to login
            const path = window.location.pathname;
            if (path !== '/' && !path.includes('index.html')) {
                window.location.href = 'index.html';
                return;
            }
        }

        updateAuthUI();

        // Auto-ping health if logged in
        if (getToken()) {
            if (typeof checkHealth === 'function') checkHealth();
        }
    }

    // ── Global exposure ───────────────────────────────────────────────────────
    window.infraApi            = api;
    window.cognito = {
        login:  startCognitoLogin,
        logout,
        getToken,
        parseJwtPayload,
        updateAuthUI,
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
