// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Reset buttons
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('bg-primary', 'text-white', 'shadow');
            b.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-200', 'dark:hover:bg-gray-800');
        });
        
        // Active button
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('bg-primary', 'text-white', 'shadow');
        targetBtn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-200', 'dark:hover:bg-gray-800');

        // Switch content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(targetBtn.dataset.target).classList.add('active');
    });
});

// Load settings
async function loadSettings() {
    try {
        const res = await apiFetch('/api/settings');
        if (res && res.ok) {
            const settings = await res.json();
            
            // Populate Email
            document.getElementById('email_enabled').checked = settings.email_enabled === 'true';
            document.getElementById('email_smtp_host').value = settings.email_smtp_host || '';
            document.getElementById('email_smtp_port').value = settings.email_smtp_port || '';
            document.getElementById('email_smtp_user').value = settings.email_smtp_user || '';
            document.getElementById('email_smtp_pass').value = settings.email_smtp_pass || '';
            document.getElementById('email_from_name').value = settings.email_from_name || '';
            document.getElementById('email_from_address').value = settings.email_from_address || '';
            
            let emailRecipients = [];
            try { emailRecipients = JSON.parse(settings.email_recipients || '[]'); } catch(e){}
            document.getElementById('email_recipients').value = emailRecipients.join('\n');

            // Populate Telegram
            document.getElementById('telegram_enabled').checked = settings.telegram_enabled === 'true';
            document.getElementById('telegram_bot_token').value = settings.telegram_bot_token || '';
            
            let telegramChatIds = [];
            try { telegramChatIds = JSON.parse(settings.telegram_chat_ids || '[]'); } catch(e){}
            document.getElementById('telegram_chat_ids').value = telegramChatIds.join('\n');
            
            document.getElementById('telegram_notify_down').checked = settings.telegram_notify_down === 'true';
            document.getElementById('telegram_notify_up').checked = settings.telegram_notify_up === 'true';
        }
    } catch (e) {
        console.error(e);
    }
}

// Save Email Settings
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const recipientsStr = document.getElementById('email_recipients').value;
    const recipients = recipientsStr.split('\n').map(s => s.trim()).filter(s => s);

    const data = {
        email_enabled: document.getElementById('email_enabled').checked.toString(),
        email_smtp_host: document.getElementById('email_smtp_host').value,
        email_smtp_port: document.getElementById('email_smtp_port').value,
        email_smtp_user: document.getElementById('email_smtp_user').value,
        email_smtp_pass: document.getElementById('email_smtp_pass').value,
        email_from_name: document.getElementById('email_from_name').value,
        email_from_address: document.getElementById('email_from_address').value,
        email_recipients: recipients
    };

    try {
        const res = await apiFetch('/api/settings/email', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        if (res && res.ok) {
            showToast('Email settings saved successfully');
        }
    } catch (e) {
        showToast('Error saving email settings', 'error');
    }
});

// Save Telegram Settings
document.getElementById('telegramForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const chatIdsStr = document.getElementById('telegram_chat_ids').value;
    const chatIds = chatIdsStr.split('\n').map(s => s.trim()).filter(s => s);

    const data = {
        telegram_enabled: document.getElementById('telegram_enabled').checked.toString(),
        telegram_bot_token: document.getElementById('telegram_bot_token').value,
        telegram_chat_ids: chatIds,
        telegram_notify_down: document.getElementById('telegram_notify_down').checked.toString(),
        telegram_notify_up: document.getElementById('telegram_notify_up').checked.toString()
    };

    try {
        const res = await apiFetch('/api/settings/telegram', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        if (res && res.ok) {
            showToast('Telegram settings saved successfully');
        }
    } catch (e) {
        showToast('Error saving Telegram settings', 'error');
    }
});

async function testEmail() {
    try {
        const res = await apiFetch('/api/settings/email/test', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast('Test email sent! Check your inbox.');
        } else {
            showToast(data.error || 'Failed to send test email', 'error');
        }
    } catch (e) {
        showToast('Network error while testing email', 'error');
    }
}

async function testTelegram() {
    try {
        const res = await apiFetch('/api/settings/telegram/test', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast('Test message sent! Check Telegram.');
        } else {
            showToast(data.error || 'Failed to send test message', 'error');
        }
    } catch (e) {
        showToast('Network error while testing Telegram', 'error');
    }
}

loadSettings();
