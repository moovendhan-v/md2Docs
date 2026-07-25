/**
 * User Console Logic
 * Scoped to avoid global namespace pollution.
 */
(function () {
    const api = window.infraApi;

    let currentFolder = 'templates';
    let currentFile = null;
    let isDirty = false;

    async function createTenant() {
        const id = document.getElementById('newTenantId').value.trim();
        if (!id) return;
        try {
            const data = await api.post(`/tenants/${id}`);
            showRes('res-create', 200, data);
        } catch (e) {
            showRes('res-create', e.response?.status || 500, e.response?.data || { detail: e.message });
        }
    }

    async function generateToken() {
        const id = document.getElementById('tokenTenantId').value.trim();
        if (!id) return;
        try {
            const data = await api.post(`/tenants/${id}/tokens`);
            localStorage.setItem('infra_user_token', data.raw_token);
            showRes('res-token', 200, data);
        } catch (e) {
            showRes('res-token', e.response?.status || 500, e.response?.data || { detail: e.message });
        }
    }

    function switchTab(tabId, btn) {
        document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(`panel-${tabId}`).classList.remove('hidden');

        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.classList.add('text-ink-300');
        });
        btn.classList.add('active');
        btn.classList.remove('text-ink-300');
    }

    function setFolder(folder, btn) {
        currentFolder = folder;
        document.querySelectorAll('.folder-btn').forEach(b => {
            b.classList.remove('active', 'bg-ink-800', 'text-ink-50');
            b.classList.add('text-ink-400');
        });
        btn.classList.add('active', 'bg-ink-800', 'text-ink-50');
        btn.classList.remove('text-ink-400');
        loadFilesList();
    }

    async function loadFilesList() {
        const listEl = document.getElementById('expFileList');
        try {
            const res = await api.get(`/files/${currentFolder}`);
            const data = res.data || res;
            if (data.files.length === 0) {
                listEl.innerHTML = '<p class="text-[10px] text-ink-500 font-mono italic px-3 py-2">No files found</p>';
            } else {
                listEl.innerHTML = data.files.map(f => `
                    <div class="group flex items-center justify-between px-3 py-1.5 rounded hover:bg-ink-800 cursor-pointer transition-colors"
                         onclick="loadFile('${f}')">
                        <span class="text-xs font-mono ${currentFile === f ? 'text-acid' : 'text-ink-300'}">${f}</span>
                        <button onclick="event.stopPropagation(); deleteFile('${f}')" 
                                class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 p-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                        </button>
                    </div>
                `).join('');
            }
        } catch (e) {
            listEl.innerHTML = `<p class="text-[10px] text-red-500 font-mono px-3 py-2">Error: ${e.response?.data?.detail || e.message}</p>`;
        }
    }

    async function loadFile(filename) {
        if (isDirty && !confirm('Discard unsaved changes?')) return;

        try {
            const res = await api.get(`/files/${currentFolder}/${filename}`);
            const data = res.data || res;
            currentFile = filename;
            document.getElementById('fileEditor').value = data.content;
            document.getElementById('activeFileLabel').innerText = `${currentFolder} / ${filename}`;
            setDirty(false);
            loadFilesList(); // update highlighting
        } catch (e) {
            alert('Failed to load file: ' + (e.response?.data?.detail || e.message));
        }
    }

    async function saveFile() {
        if (!currentFile) return;
        const content = document.getElementById('fileEditor').value;

        try {
            await api.put(`/files/${currentFolder}/${currentFile}`, { content });
            setDirty(false);
            alert('File saved');
        } catch (e) {
            alert('Failed to save: ' + (e.response?.data?.detail || e.message));
        }
    }

    async function createNewFile() {
        const name = prompt('Enter filename (e.g. my-note.md):');
        if (!name) return;

        try {
            const res = await api.post(`/files/${currentFolder}/${name}`, {});
            const data = res.data || res;
            await loadFilesList();
            await loadFile(data.filename);
        } catch (e) {
            alert('Failed to create: ' + (e.response?.data?.detail || e.message));
        }
    }

    async function deleteFile(filename) {
        if (!confirm(`Delete ${filename}?`)) return;

        try {
            await api.delete(`/files/${currentFolder}/${filename}`);
            if (currentFile === filename) {
                currentFile = null;
                document.getElementById('fileEditor').value = '';
                document.getElementById('activeFileLabel').innerText = 'no file selected';
                setDirty(false);
            }
            loadFilesList();
        } catch (e) {
            alert('Failed to delete: ' + (e.response?.data?.detail || e.message));
        }
    }

    function onEditorChange() {
        if (currentFile) setDirty(true);
    }

    function setDirty(dirty) {
        isDirty = dirty;
        document.getElementById('fileDirty').classList.toggle('hidden', !dirty);
        const saveBtn = document.getElementById('btnSave');
        saveBtn.disabled = !dirty;
        saveBtn.classList.toggle('opacity-50', !dirty);
        saveBtn.classList.toggle('cursor-not-allowed', !dirty);
    }

    function showRes(id, status, data) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('hidden');
        let html = `<div class="p-3 rounded bg-ink-900 border ${status < 300 ? 'border-acid/30' : 'border-red-900/50'}">`;

        if (data.raw_token) {
            html += `<p class="text-[10px] text-acid font-mono mb-2">ACCESS TOKEN ISSUED:</p>
             <div class="token-reveal">${data.raw_token}</div>
             <p class="text-[10px] text-ink-400 mt-2">Save this securely. It won't be shown again.</p>`;
        } else {
            html += `<pre class="text-[11px] font-mono text-ink-200 overflow-auto">${JSON.stringify(data, null, 2)}</pre>`;
        }
        html += '</div>';
        el.innerHTML = html;
    }

    function saveConfig() {
        const baseUrl = document.getElementById('baseUrl').value.trim();
        localStorage.setItem('infra_user_base_url', baseUrl);
        alert('Configuration saved to localStorage');
    }

    function initConfig() {
        const savedBase = localStorage.getItem('infra_user_base_url');
        if (savedBase) document.getElementById('baseUrl').value = savedBase;

        const savedToken = localStorage.getItem('infra_user_token');
        if (savedToken) document.getElementById('userAccessToken').value = savedToken;
    }

    // Global exposure
    window.createTenant = createTenant;
    window.generateToken = generateToken;
    window.showRes = showRes;
    window.switchTab = switchTab;
    window.setFolder = setFolder;
    window.loadFilesList = loadFilesList;
    window.loadFile = loadFile;
    window.saveFile = saveFile;
    window.createNewFile = createNewFile;
    window.deleteFile = deleteFile;
    window.onEditorChange = onEditorChange;
    window.saveConfig = saveConfig;
    // Init
    initConfig();
})();
