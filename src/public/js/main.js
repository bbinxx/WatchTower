// Utility for generic auth-based fetch
// Firebase session is stored in httpOnly cookie, so we don't need to pass Bearer token anymore,
// but we include credentials so cookies are sent.
async function apiFetch(url, options = {}) {
    if (!localStorage.getItem('user') && window.location.pathname !== '/login') {
        window.location.href = '/login';
        return null;
    }

    const fetchOptions = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, fetchOptions);
        if (response.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
            return null;
        }
        return response;
    } catch (err) {
        console.error('API Fetch Error:', err);
        throw err;
    }
}

// Theme handling
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        if (document.documentElement.classList.contains('dark')) {
            localStorage.theme = 'dark';
        } else {
            localStorage.theme = 'light';
        }
    });
}

// Logout
function logout() {
    apiFetch('/api/logout', { method: 'POST' }).then(() => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    });
}

// User Initials
const user = JSON.parse(localStorage.getItem('user'));
const ui = document.getElementById('userInitial');
if (user && ui) {
    ui.textContent = user.email.charAt(0).toUpperCase();
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMsg');
    const icon = document.getElementById('toastIcon');
    
    if (!toast) return;

    msg.textContent = message;
    if (type === 'error') {
        icon.className = 'fa-solid fa-circle-xmark text-red-400';
    } else if (type === 'warning') {
        icon.className = 'fa-solid fa-triangle-exclamation text-yellow-400';
    } else {
        icon.className = 'fa-solid fa-circle-check text-green-400';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// Worker health check
let workerHealthy = true;
async function checkWorkerHealth() {
    try {
        const res = await fetch('/api/health');
        if (res.ok) {
            if (!workerHealthy) {
                workerHealthy = true;
                hideWorkerBanner();
            }
        }
    } catch (e) {
        if (workerHealthy) {
            workerHealthy = false;
            showWorkerBanner();
        }
    }
}

function showWorkerBanner() {
    let banner = document.getElementById('workerBanner');
    if (banner) return;
    banner = document.createElement('div');
    banner.id = 'workerBanner';
    banner.className = 'bg-yellow-500 text-white text-center py-2 text-sm font-medium';
    banner.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-2"></i> Worker process may be offline. Run <code class="bg-yellow-600 px-1 rounded">npm run dev:all</code> to start all services.';
    document.body.prepend(banner);
}

function hideWorkerBanner() {
    const banner = document.getElementById('workerBanner');
    if (banner) banner.remove();
}

setInterval(checkWorkerHealth, 30000);
checkWorkerHealth();

// App version
async function loadVersion() {
    try {
        const res = await fetch('/api/health');
        if (res.ok) {
            const data = await res.json();
            const el = document.getElementById('appVersion');
            if (el) el.textContent = 'v' + data.version;
        }
    } catch (e) {}
}
loadVersion();
