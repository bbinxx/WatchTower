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
                <div class="text-sm text-gray-500 flex justify-between mt-4 border-t dark:border-darkBorder pt-4">
                    <span>Check interval: ${monitor.interval}s</span>
                </div>
            </div>
            <div class="mt-4 flex gap-2 justify-end">
                <button onclick="deleteMonitor(${monitor.id})" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(el);
    });
}

function openAddModal() {
    const modal = document.getElementById('addModal');
    modal.classList.remove('hidden');
    // slight delay for transition
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeAddModal() {
    const modal = document.getElementById('addModal');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

document.getElementById('addMonitorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('mName').value,
        type: document.getElementById('mType').value,
        url: document.getElementById('mUrl').value,
        interval: parseInt(document.getElementById('mInterval').value),
        use_global_notifications: document.getElementById('mGlobalNotif').checked ? 1 : 0
    };

    try {
        const res = await apiFetch('/api/monitors', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (res && res.ok) {
            closeAddModal();
            fetchMonitors();
            e.target.reset();
        }
    } catch (e) {
        console.error(e);
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
