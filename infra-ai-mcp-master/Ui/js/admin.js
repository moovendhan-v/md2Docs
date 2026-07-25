/**
 * Admin Console Logic
 * Refactored to use axios instance from api.js
 */
(function () {
    let activeFolder = 'templates';
    let activeFile = null;

    const api = window.infraApi;

    function switchTab(name, el) {
        document.querySelectorAll('.tab-btn').forEach(t => {
            t.classList.remove('active');
            t.classList.add('text-ink-300');
        });
        el.classList.add('active');
        el.classList.remove('text-ink-300');
        document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
        const target = document.getElementById('panel-' + name);
        if (target) target.classList.remove('hidden');
        if (name === 'logs') fetchLogs();
    }

    function setFolder(name, el) {
        activeFolder = name;
        document.querySelectorAll('.folder-btn').forEach(b => {
            b.classList.remove('active', 'bg-ink-800', 'text-ink-50');
            b.classList.add('text-ink-400');
        });
        el.classList.add('active', 'bg-ink-800', 'text-ink-50');
        el.classList.remove('text-ink-400');
        loadFilesList();
    }

    async function loadTenantsList() {
        try {
            const res = await api.get('/tenants');
            const select = document.getElementById('expTenantId');
            if (!select) return;
            const tenants = res.tenants || {};
            const details = res.details || {};
            select.innerHTML = '<option value="">Select Tenant...</option>';
            Object.entries(tenants).forEach(([name, uuid]) => {
                const opt = document.createElement('option');
                opt.value = uuid;
                const email = details[name]?.email || name;
                opt.textContent = email;
                select.appendChild(opt);
            });
        } catch (e) {
            console.error('Failed to load tenants', e);
        }
    }

    async function loadFilesList() {
        const tenantId = document.getElementById('expTenantId').value;
        if (!tenantId) return;
        const listEl = document.getElementById('expFileList');
        listEl.innerHTML = '<p class="text-[10px] text-ink-500 font-mono">Loading...</p>';

        try {
            const data = await api.get(`/files/${activeFolder}`, {
                headers: { 'x-tenant-id': tenantId }
            });
            if (data.files && data.files.length > 0) {
                listEl.innerHTML = data.files.map(f => {
                    const escapedFile = f.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                    return `
                    <button class="w-full text-left text-[11px] px-3 py-2 rounded hover:bg-ink-800 font-mono flex items-center justify-between group" onclick="loadFile('${escapedFile}')">
                        <span>${f}</span>
                        <svg onclick="deleteFile(event, '${escapedFile}')" class="w-3 h-3 text-red-900 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `}).join('');
            } else {
                listEl.innerHTML = '<p class="text-[10px] text-ink-500 font-mono">No files found.</p>';
            }
        } catch (e) {
            listEl.innerHTML = `<p class="text-[10px] text-red-500 font-mono">Error: ${e.message}</p>`;
        }
    }

    async function loadFile(filename) {
        const tenantId = document.getElementById('expTenantId').value;
        activeFile = filename;
        document.getElementById('activeFileLabel').textContent = `${activeFolder} / ${filename}`;

        try {
            const data = await api.get(`/files/${activeFolder}/${encodeURIComponent(filename)}`, {
                headers: { 'x-tenant-id': tenantId }
            });
            document.getElementById('fileEditor').value = data.content || '';
            setDirty(false);
        } catch (e) {
            alert('Failed to load file content');
        }
    }

    async function saveFile() {
        if (!activeFile) return;
        const tenantId = document.getElementById('expTenantId').value;
        const content = document.getElementById('fileEditor').value;

        try {
            await api.put(`/files/${activeFolder}/${encodeURIComponent(activeFile)}`, { content }, {
                headers: { 'x-tenant-id': tenantId }
            });
            setDirty(false);
            alert('File saved successfully');
        } catch (e) {
            alert('Error saving file');
        }
    }

    async function deleteFile(e, filename) {
        e.stopPropagation();
        if (!confirm(`Delete ${filename}?`)) return;
        const tenantId = document.getElementById('expTenantId').value;

        try {
            await api.delete(`/files/${activeFolder}/${encodeURIComponent(filename)}`, {
                headers: { 'x-tenant-id': tenantId }
            });
            loadFilesList();
            if (activeFile === filename) {
                activeFile = null;
                document.getElementById('fileEditor').value = '';
                document.getElementById('activeFileLabel').textContent = 'no file selected';
            }
        } catch (e) {
            alert('Failed to delete file');
        }
    }

    async function createNewFile() {
        const tenantId = document.getElementById('expTenantId').value;
        if (!tenantId) {
            alert('Please select a tenant first');
            return;
        }
        const filename = prompt('Enter filename (e.g. guide.md):');
        if (!filename) return;

        try {
            await api.post(`/files/${activeFolder}/${encodeURIComponent(filename)}`, {}, {
                headers: { 'x-tenant-id': tenantId }
            });
            alert('File created');
            loadFilesList();
        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || 'Could not create file'));
        }
    }

    function onEditorChange() {
        setDirty(true);
    }

    function setDirty(isDirty) {
        const btn = document.getElementById('btnSave');
        const dot = document.getElementById('fileDirty');
        if (!btn || !dot) return;
        if (isDirty && activeFile) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            dot.classList.remove('hidden');
        } else {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            dot.classList.add('hidden');
        }
    }

    async function fetchLogs() {
        const lines = document.getElementById('logLines').value;
        const el = document.getElementById('res-logs');
        if (!el) return;
        try {
            const data = await api.get(`/logs?lines=${lines}`);
            if (data.logs) {
                el.textContent = data.logs.join('\n');
                el.scrollTop = el.scrollHeight;
            }
        } catch (e) { }
    }

    async function checkHealth() {
        const el = document.getElementById('healthDot');
        if (!el) return;
        try {
            await api.get('/health-check');
            el.innerHTML = '<span class="status-ok">● online</span>';
        } catch {
            el.innerHTML = '<span class="status-err">● unreachable</span>';
        }
    }

    async function inviteUser() {
        const email      = (document.getElementById('inviteEmail')?.value || '').trim();
        const givenName  = (document.getElementById('inviteGivenName')?.value || '').trim();
        const familyName = (document.getElementById('inviteFamilyName')?.value || '').trim();
        const statusEl   = document.getElementById('inviteStatus');

        if (!email) { alert('Email is required'); return; }

        statusEl.textContent = 'Sending…';
        statusEl.className = 'text-xs font-mono text-ink-400';
        statusEl.classList.remove('hidden');

        try {
            const res = await api.post('/tenants/invite', {
                email,
                given_name: givenName || undefined,
                family_name: familyName || undefined,
            });
            const verb = res.resent ? 'Resent' : 'Sent';
            statusEl.textContent = `✓ ${verb} to ${email}`;
            statusEl.className = 'text-xs font-mono status-ok';
            document.getElementById('inviteEmail').value = '';
            document.getElementById('inviteGivenName').value = '';
            document.getElementById('inviteFamilyName').value = '';
            listTenants();
        } catch (e) {
            statusEl.textContent = `✗ ${e.response?.data?.detail || e.message}`;
            statusEl.className = 'text-xs font-mono status-err';
        }
    }

    async function disableTenant(name) {
        if (!confirm(`Are you sure you want to disable tenant '${name}'? They will be globally signed out and blocked from logging in.`)) return;
        try {
            await api.delete(`/tenants/${name}`);
            alert(`Tenant '${name}' disabled successfully.`);
            listTenants();
        } catch (e) {
            alert('Failed to disable tenant: ' + (e.response?.data?.detail || e.message));
        }
    }

    async function enableTenant(name) {
        try {
            await api.post(`/tenants/${name}/enable`);
            alert(`Tenant '${name}' enabled successfully.`);
            listTenants();
        } catch (e) {
            alert('Failed to enable tenant: ' + (e.response?.data?.detail || e.message));
        }
    }

    async function listTenants() {
        try {
            const res = await api.get('/tenants');
            const tenants = res.tenants || {};
            const details = res.details || {};
            const el = document.getElementById('res-list-tenants');
            if (!el) return;
            el.innerHTML = Object.entries(tenants).map(([name, uuid]) => {
                const det = details[name] || {};
                const isEnabled = det.enabled !== false;
                const status = det.status || 'UNKNOWN';
                const isPending = status === 'FORCE_CHANGE_PASSWORD';
                const isStale = det.invite_stale === true;

                const statusLabel = isPending ? 'Pending' : (isEnabled ? 'Active' : 'Disabled');
                const statusColor = isPending
                    ? 'text-yellow-400 bg-yellow-400/10'
                    : (isEnabled ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10');

                const toggleBtn = isEnabled
                    ? `<button onclick="disableTenant('${name}')" class="text-[10px] font-mono text-red-400 hover:text-red-300 px-2 py-1 border border-red-900/50 hover:border-red-500/50 rounded bg-red-950/20">DISABLE</button>`
                    : `<button onclick="enableTenant('${name}')" class="text-[10px] font-mono text-green-400 hover:text-green-300 px-2 py-1 border border-green-900/50 hover:border-green-500/50 rounded bg-green-950/20">ENABLE</button>`;

                const resendBtn = isPending
                    ? `<button onclick="resendInvite('${name}')" class="text-[10px] font-mono ${isStale ? 'text-acid' : 'text-ink-400 hover:text-ink-200'} px-2 py-1 border ${isStale ? 'border-acid/40 bg-acid/10' : 'border-ink-700'} rounded" title="${isStale ? 'Invite is stale — resend recommended' : 'Resend invite'}">
                        ${isStale ? '⚠ RESEND' : 'RESEND'}
                    </button>`
                    : '';

                return `
                    <div class="p-3 bg-ink-900/40 border border-ink-800 rounded-lg">
                        <div class="flex items-start justify-between gap-2 mb-2">
                            <div class="flex flex-col gap-0.5 min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-xs font-mono text-ink-50 font-medium truncate">${det.email || name}</span>
                                    <span class="text-[9px] px-1.5 py-0.5 rounded font-mono ${statusColor}">${statusLabel}</span>
                                </div>
                                <span class="text-[10px] font-mono text-ink-500 truncate">ID: ${uuid}</span>
                            </div>
                        </div>
                        <div class="flex gap-1.5 flex-wrap">
                            ${toggleBtn}
                            ${resendBtn}
                        </div>
                    </div>
                `;
            }).join('');
            if (Object.keys(tenants).length === 0) {
                el.innerHTML = '<p class="text-xs text-ink-500 italic">No tenants found</p>';
            }
        } catch (e) {
            alert('Failed to list tenants');
        }
    }

    async function resendInvite(username) {
        try {
            await api.post(`/tenants/${username}/resend-invite`);
            alert(`Invite resent to ${username}`);
            listTenants();
        } catch (e) {
            alert('Failed to resend invite: ' + (e.response?.data?.detail || e.message));
        }
    }

    // ─── Token Management ──────────────────────────────────────────────────

    async function loadTokens() {
        const tbody = document.getElementById('tokensTableBody');
        if (!tbody) return;
        try {
            const res = await api.get('/tokens');
            const tokens = res.tokens || {};
            tbody.innerHTML = '';

            Object.entries(tokens).forEach(([jti, info]) => {
                const filter = document.getElementById('tokenFilterTenant').value;
                if (filter && info.tenant_id !== filter) return;

                const tr = document.createElement('tr');
                tr.className = 'border-b border-ink-800 hover:bg-ink-800/30 transition-colors';

                const created = new Date(info.created_at * 1000).toLocaleDateString();
                const expires = new Date(info.expires_at * 1000).toLocaleDateString();

                tr.innerHTML = `
                    <td class="px-4 py-4 text-ink-50">${info.friendly_name || 'N/A'}</td>
                    <td class="px-4 py-4 text-ink-400 font-mono text-[10px]">${jti.slice(0, 8)}...</td>
                    <td class="px-4 py-4 text-ink-400">${created}</td>
                    <td class="px-4 py-4 text-ink-400">${expires}</td>
                    <td class="px-4 py-4 text-right">
                        <button onclick="Admin.revokeToken('${jti}')" class="text-red-400 hover:text-red-300 transition-colors px-2 py-1">REVOKE</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (Object.keys(tokens).length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-ink-500 italic">No active tokens found</td></tr>';
            }
        } catch (e) {
            console.error('Error loading tokens:', e);
        }
    }

    async function revokeToken(jti) {
        if (!confirm('Are you sure you want to revoke this token? The user will lose access immediately.')) return;
        try {
            await api.delete(`/tokens/${jti}`);
            loadTokens();
        } catch (e) {
            alert('Failed to revoke token');
        }
    }

    async function loadTenantsForFilter() {
        const select = document.getElementById('tokenFilterTenant');
        if (!select) return;
        try {
            const res = await api.get('/tenants');
            const tenants = res.tenants || {};
            const current = select.value;
            select.innerHTML = '<option value="">All Tenants</option>';
            Object.entries(tenants).forEach(([name, uuid]) => {
                const opt = document.createElement('option');
                opt.value = uuid;
                opt.textContent = name;
                if (uuid === current) opt.selected = true;
                select.appendChild(opt);
            });
        } catch (e) { }
    }

    function saveBaseUrl() {
        const baseUrl = document.getElementById('baseUrl').value.trim();
        localStorage.setItem('infra_admin_base_url', baseUrl);
        checkHealth();
    }

    // Global exposure for HTML onclick handlers
    window.switchTab = switchTab;
    window.setFolder = setFolder;
    window.loadTenantsList = loadTenantsList;
    window.loadFilesList = loadFilesList;
    window.loadFile = loadFile;
    window.saveFile = saveFile;
    window.deleteFile = deleteFile;
    window.createNewFile = createNewFile;
    window.onEditorChange = onEditorChange;
    window.fetchLogs = fetchLogs;
    window.checkHealth = checkHealth;
    window.listTenants = listTenants;
    window.inviteUser = inviteUser;
    window.resendInvite = resendInvite;
    window.disableTenant = disableTenant;
    window.enableTenant = enableTenant;
    window.loadTokens = loadTokens;
    window.revokeToken = revokeToken;
    window.loadTenantsForFilter = loadTenantsForFilter;
    window.saveBaseUrl = saveBaseUrl;

    // Explicit Admin namespace for inner handlers if needed
    window.Admin = { loadTokens, revokeToken, loadTenantsList };

    // Init — auth state is handled by api.js
    if (typeof cognito !== 'undefined') cognito.updateAuthUI();
    setInterval(() => {
        const panel = document.getElementById('panel-logs');
        if (panel && !panel.classList.contains('hidden')) {
            fetchLogs();
        }
    }, 5000);
})();
