const cron = require('node-cron');
const Monitor = require('../models/Monitor');
const MonitorService = require('./MonitorService');
const Incident = require('../models/Incident');
const AlertService = require('./AlertService');

const lastChecked = new Map();

class SchedulerService {
    static init() {
        // Self-ping to prevent Render from sleeping
        if (process.env.RENDER_EXTERNAL_URL) {
            console.log(`Setting up Render Keep-Alive for ${process.env.RENDER_EXTERNAL_URL}`);
            cron.schedule('*/14 * * * *', async () => {
                try {
                    const axios = require('axios');
                    await axios.get(process.env.RENDER_EXTERNAL_URL);
                    console.log('Render Keep-Alive ping successful');
                } catch (e) {
                    console.error('Render Keep-Alive ping failed:', e.message);
                }
            });
        }

        // Master loop every 10 seconds
        cron.schedule('*/10 * * * * *', async () => {
            const monitors = await Monitor.getAll();
            const now = Date.now();

            for (const monitor of monitors) {
                const intervalMs = monitor.interval * 1000;
                const last = lastChecked.get(monitor.id) || 0;

                if (now - last >= intervalMs) {
                    lastChecked.set(monitor.id, now);
                    MonitorService.runCheck(monitor); // run asynchronously without blocking next
                }
            }
        });

        // Escalation loop every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            const monitors = await Monitor.getAll();
            for (const monitor of monitors) {
                const openIncident = await Incident.getOpenByMonitor(monitor.id);
                // If open and unacknowledged for more than 5 mins, escalate
                if (openIncident && !openIncident.acknowledged_at) {
                    await AlertService.handleDown(monitor, openIncident); // resend alert
                }
            }
        });

        console.log('Scheduler initialized.');
    }
}

module.exports = SchedulerService;
