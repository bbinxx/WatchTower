let monitors = [];

async function fetchMonitors() {
    try {
        const res = await apiFetch('/api/monitors');
        if (res) {
            monitors = await res.json();
            renderMonitors();
            updateStats();
        }
    } catch (e) {
        console.error(e);
    }
}

function updateStats() {
    document.getElementById('totalMonitors').textContent = monitors.length;
    document.getElementById('upMonitors').textContent = monitors.filter(m => m.status === 'up').length;
    document.getElementById('downMonitors').textContent = monitors.filter(m => m.status === 'down').length;
}

function renderMonitors() {
    const container = document.getElementById('monitorsContainer');
    container.innerHTML = '';

    monitors.forEach(monitor => {
        const statusColor = monitor.status === 'up' ? 'text-green-500 bg-green-100 dark:bg-green-900/30' : 
                            monitor.status === 'down' ? 'text-red-500 bg-red-100 dark:bg-red-900/30' : 'text-gray-500 bg-gray-100 dark:bg-gray-800';
        
        const statusIcon = monitor.status === 'up' ? 'fa-circle-check' : 
                           monitor.status === 'down' ? 'fa-circle-xmark' : 'fa-circle-question';

        const createdAt = monitor.created_at ? new Date(monitor.created_at).toLocaleString() : 'Unknown';
        const updatedAt = monitor.updated_at ? new Date(monitor.updated_at).toLocaleString() : 'Never';
        const notifs = monitor.use_global_notifications === 1 ? 'Global Default' : 'Custom Override';

        const el = document.createElement('div');
        el.className = 'bg-white dark:bg-darkCard p-5 rounded-xl shadow-md flex flex-col justify-between transition-all hover:shadow-lg border border-transparent hover:border-gray-200 dark:hover:border-darkBorder';
        el.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-bold text-lg flex items-center gap-2">
                            ${monitor.name} 
                            <span class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase">${monitor.type}</span>
                        </h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 break-all">${monitor.url}</p>
                    </div>
                    <div class="flex items-center gap-2 ${statusColor} px-3 py-1 rounded-full text-sm font-medium shadow-inner">
                        <i class="fa-solid ${statusIcon}"></i> ${monitor.status.toUpperCase()}
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mt-6 text-sm text-gray-600 dark:text-gray-400 border-t dark:border-darkBorder pt-4">
                    <div>
                        <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Check Interval</p>
                        <p class="font-medium">${monitor.interval} seconds</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Notifications</p>
                        <p class="font-medium">${notifs}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Created</p>
                        <p class="font-medium truncate" title="${createdAt}">${createdAt}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Last Updated</p>
                        <p class="font-medium truncate" title="${updatedAt}">${updatedAt}</p>
                    </div>
                </div>
            </div>
            
            <div class="mt-4 flex gap-2 justify-end border-t dark:border-darkBorder pt-4">
                <button onclick="openMonitorModal('${monitor.id}')" class="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded transition-colors text-sm font-medium" title="Edit">
                    <i class="fa-solid fa-pen mr-1"></i> Edit
                </button>
                <button onclick="deleteMonitor('${monitor.id}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded transition-colors text-sm font-medium" title="Delete">
                    <i class="fa-solid fa-trash mr-1"></i> Delete
                </button>
            </div>
        `;
        container.appendChild(el);
    });
}

function updateUrlPlaceholder() {
    const type = document.getElementById('mType').value;
    const urlInput = document.getElementById('mUrl');
    if (type === 'http') {
        urlInput.placeholder = 'https://example.com';
    } else if (type === 'ping') {
        urlInput.placeholder = '8.8.8.8 or example.com';
    } else if (type === 'port') {
        urlInput.placeholder = '127.0.0.1:27017';
    }
}

document.getElementById('mType').addEventListener('change', updateUrlPlaceholder);

function openMonitorModal(id = null) {
    const modal = document.getElementById('monitorModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('monitorForm');
    const resultDiv = document.getElementById('monitorCheckResult');
    const saveBtn = document.getElementById('saveMonitorBtn');
    
    resultDiv.classList.add('hidden');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Monitor';

    if (id) {
        title.textContent = 'Edit Monitor';
        const monitor = monitors.find(m => m.id === id);
        if (monitor) {
            document.getElementById('mId').value = monitor.id;
            document.getElementById('mName').value = monitor.name;
            document.getElementById('mType').value = monitor.type;
            document.getElementById('mUrl').value = monitor.url;
            document.getElementById('mInterval').value = monitor.interval;
            document.getElementById('mGlobalNotif').checked = monitor.use_global_notifications === 1;
        }
    } else {
        title.textContent = 'Add Monitor';
        form.reset();
        document.getElementById('mId').value = '';
        document.getElementById('mGlobalNotif').checked = true;
    }
    
    updateUrlPlaceholder();

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeMonitorModal() {
    const modal = document.getElementById('monitorModal');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

document.getElementById('monitorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('mId').value;
    const resultDiv = document.getElementById('monitorCheckResult');
    const saveBtn = document.getElementById('saveMonitorBtn');
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving & Checking...';
    resultDiv.classList.add('hidden');

    const data = {
        name: document.getElementById('mName').value,
        type: document.getElementById('mType').value,
        url: document.getElementById('mUrl').value,
        interval: parseInt(document.getElementById('mInterval').value),
        use_global_notifications: document.getElementById('mGlobalNotif').checked ? 1 : 0
    };

    try {
        const url = id ? `/api/monitors/${id}` : '/api/monitors';
        const method = id ? 'PUT' : 'POST';

        const res = await apiFetch(url, {
            method: method,
            body: JSON.stringify(data)
        });
        
        if (res && res.ok) {
            const responseData = await res.json();
            const check = responseData.checkResult;
            
            resultDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
            
            if (check && check.status === 'down') {
                resultDiv.classList.add('bg-red-100', 'text-red-700');
                resultDiv.innerHTML = `<strong>Check Failed:</strong> ${check.error || 'Unreachable'}`;
                showToast('Monitor saved, but check failed.', 'error');
            } else {
                resultDiv.classList.add('bg-green-100', 'text-green-700');
                resultDiv.innerHTML = `<strong>Check Successful:</strong> Connected in ${check ? check.responseTime : 0}ms`;
                showToast('Monitor saved successfully.');
                
                // Close modal after success
                setTimeout(() => {
                    closeMonitorModal();
                }, 1500);
            }

            fetchMonitors();
        } else {
            showToast('Failed to save monitor.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Monitor';
    }
});

async function deleteMonitor(id) {
    if (confirm('Are you sure you want to delete this monitor?')) {
        await apiFetch(`/api/monitors/${id}`, { method: 'DELETE' });
        fetchMonitors();
    }
}

// Initial fetch and poll every 10s
fetchMonitors();
setInterval(fetchMonitors, 10000);
