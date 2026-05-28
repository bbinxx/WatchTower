require('dotenv').config();
const { verifyConnection } = require('./config/firebase');
const Monitor = require('./models/Monitor');
const MonitorService = require('./services/MonitorService');
const Incident = require('./models/Incident');
const AlertService = require('./services/AlertService');

async function run() {
    console.log('[Cron] Monitor check starting...');
    await verifyConnection();

    try {
        const monitors = await Monitor.getAll();
        const now = Date.now();
        let checked = 0;

        for (const monitor of monitors) {
            const intervalMs = monitor.interval * 1000;
            const lastCheck = monitor.last_checked_at || 0;

            if (now - lastCheck >= intervalMs) {
                try {
                    await MonitorService.runCheck(monitor);
                    checked++;
                } catch (err) {
                    console.error(`[Cron] Check failed for "${monitor.name}":`, err.message);
                }
            }
        }

        console.log(`[Cron] Checked ${checked}/${monitors.length} monitors.`);

        // Escalation: re-alert on unacknowledged incidents
        for (const monitor of monitors) {
            const openIncident = await Incident.getOpenByMonitor(monitor.id);
            if (openIncident && !openIncident.acknowledged_at) {
                try {
                    await AlertService.handleDown(monitor, openIncident);
                } catch (err) {
                    console.error(`[Cron] Escalation failed for "${monitor.name}":`, err.message);
                }
            }
        }
    } catch (err) {
        console.error('[Cron] Fatal error:', err.message);
    }

    console.log('[Cron] Done.');
}

run();
