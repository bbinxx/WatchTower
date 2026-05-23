const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../../data/uptime.db');
// Ensure directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

function initDb() {
    // Create users table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at INTEGER DEFAULT (unixepoch())
        )
    `).run();

    // Create system_settings table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at INTEGER DEFAULT (unixepoch()),
            updated_by INTEGER
        )
    `).run();

    // Create monitors table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS monitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- http, ping, port
            url TEXT NOT NULL,
            interval INTEGER DEFAULT 60, -- in seconds
            status TEXT DEFAULT 'unknown',
            notification_override TEXT, -- JSON
            use_global_notifications INTEGER DEFAULT 1,
            user_id INTEGER,
            created_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `).run();

    // Create checks table (history of monitor checks)
    db.prepare(`
        CREATE TABLE IF NOT EXISTS checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            monitor_id INTEGER NOT NULL,
            status TEXT NOT NULL, -- up, down
            response_time INTEGER, -- in ms
            status_code INTEGER,
            error TEXT,
            created_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (monitor_id) REFERENCES monitors(id)
        )
    `).run();

    // Create incidents table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            monitor_id INTEGER NOT NULL,
            status TEXT DEFAULT 'open', -- open, acknowledged, resolved
            error TEXT,
            started_at INTEGER DEFAULT (unixepoch()),
            resolved_at INTEGER,
            acknowledged_at INTEGER,
            FOREIGN KEY (monitor_id) REFERENCES monitors(id)
        )
    `).run();

    // Create alert_history table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS alert_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id INTEGER NOT NULL,
            channel TEXT NOT NULL, -- email, telegram
            status TEXT NOT NULL, -- success, failed
            error TEXT,
            created_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
        )
    `).run();

    // Seed default admin
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run('admin@example.com', hash, 'admin');
        console.log('Default admin user created: admin@example.com / admin123');
    }

    // Seed default settings
    const seedSettings = [
        ['email_enabled', 'false'],
        ['email_smtp_host', 'smtp.gmail.com'],
        ['email_smtp_port', '587'],
        ['email_smtp_user', ''],
        ['email_smtp_pass', ''],
        ['email_recipients', '[]'],
        ['email_from_name', 'WatchTower'],
        ['email_from_address', 'alerts@example.com'],
        ['telegram_enabled', 'false'],
        ['telegram_bot_token', ''],
        ['telegram_chat_ids', '[]'],
        ['telegram_notify_down', 'true'],
        ['telegram_notify_up', 'true']
    ];

    const insertSetting = db.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)');
    seedSettings.forEach(setting => {
        insertSetting.run(setting[0], setting[1]);
    });
}

initDb();

module.exports = db;
