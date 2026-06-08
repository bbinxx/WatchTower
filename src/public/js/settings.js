// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('bg-primary', 'text-white', 'shadow');
            b.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-200', 'dark:hover:bg-gray-800');
        });

        const targetBtn = e.currentTarget;
        targetBtn.classList.add('bg-primary', 'text-white', 'shadow');
        targetBtn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-200', 'dark:hover:bg-gray-800');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(targetBtn.dataset.target).classList.add('active');
    });
});

async function loadSettings() {
    try {
        const res = await apiFetch('/api/settings');
        if (res && res.ok) {
            const s = await res.json();

            document.getElementById('emailStatus').textContent = s.email_enabled === 'true' ? 'Enabled' : 'Disabled';
            document.getElementById('emailStatus').className = 'font-medium ' + (s.email_enabled === 'true' ? 'text-green-500' : 'text-gray-500');
            document.getElementById('emailSmtpHost').textContent = s.email_smtp_host || '-';
            document.getElementById('emailSmtpPort').textContent = s.email_smtp_port || '-';
            document.getElementById('emailFrom').textContent = s.email_from_name && s.email_from_address ? `${s.email_from_name} <${s.email_from_address}>` : '-';

            let emailRecipients = [];
            try { emailRecipients = JSON.parse(s.email_recipients || '[]'); } catch(e){}
            document.getElementById('email_recipients').value = emailRecipients.join('\n');

            document.getElementById('telegramStatus').textContent = s.telegram_enabled === 'true' ? 'Enabled' : 'Disabled';
            document.getElementById('telegramStatus').className = 'font-medium ' + (s.telegram_enabled === 'true' ? 'text-green-500' : 'text-gray-500');
            document.getElementById('telegramBotToken').textContent = 'Set in .env';

            let telegramChatIds = [];
            try { telegramChatIds = JSON.parse(s.telegram_chat_ids || '[]'); } catch(e){}
            document.getElementById('telegram_chat_ids').value = telegramChatIds.join('\n');

            document.getElementById('telegramNotifyDown').textContent = s.telegram_notify_down === 'true' ? 'Yes' : 'No';
            document.getElementById('telegramNotifyUp').textContent = s.telegram_notify_up === 'true' ? 'Yes' : 'No';
        }
    } catch (e) {
        console.error(e);
    }
}

async function saveEmailRecipients() {
    const recipientsStr = document.getElementById('email_recipients').value;
    const recipients = recipientsStr.split('\n').map(s => s.trim()).filter(s => s);

    try {
        const res = await apiFetch('/api/settings/email', {
            method: 'PUT',
            body: JSON.stringify({ email_recipients: recipients })
        });
        if (res && res.ok) {
            showToast('Email recipients saved');
        }
    } catch (e) {
        showToast('Error saving recipients', 'error');
    }
}

async function saveTelegramChatIds() {
    const chatIdsStr = document.getElementById('telegram_chat_ids').value;
    const chatIds = chatIdsStr.split('\n').map(s => s.trim()).filter(s => s);

    try {
        const res = await apiFetch('/api/settings/telegram', {
            method: 'PUT',
            body: JSON.stringify({ telegram_chat_ids: chatIds })
        });
        if (res && res.ok) {
            showToast('Telegram chat IDs saved');
        }
    } catch (e) {
        showToast('Error saving chat IDs', 'error');
    }
}

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
