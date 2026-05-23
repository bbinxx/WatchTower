// Utility for generic auth-based fetch
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token && window.location.pathname !== '/login') {
        window.location.href = '/login';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            localStorage.removeItem('token');
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
        localStorage.removeItem('token');
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
    } else {
        icon.className = 'fa-solid fa-circle-check text-green-400';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}
