const axios = require('axios');
const ping = require('ping');
const tcpp = require('tcp-ping');
const Monitor = require('../models/Monitor');
const Check = require('../models/Check');
const Incident = require('../models/Incident');
const AlertService = require('./AlertService');
const https = require('https');

class MonitorService {
    static async runCheck(monitor) {
        let status = 'down';
        let responseTime = 0;
        let statusCode = null;
        let error = null;

        const startTime = Date.now();

        try {
            if (monitor.type === 'http') {
                const agent = new https.Agent({ rejectUnauthorized: false }); // for testing SSL issues or ignoring them
                const res = await axios.get(monitor.url, { timeout: 10000, httpsAgent: agent });
                status = 'up';
                statusCode = res.status;
                responseTime = Date.now() - startTime;
            } else if (monitor.type === 'ping') {
                const res = await ping.promise.probe(monitor.url, { timeout: 10 });
                if (res.alive) {
                    status = 'up';
                    responseTime = res.time;
                } else {
                    error = 'Host unreachable';
                }
            } else if (monitor.type === 'port') {
                const [host, port] = monitor.url.split(':');
                status = await new Promise((resolve) => {
                    tcpp.probe(host, parseInt(port), (err, available) => {
                        resolve(available ? 'up' : 'down');
                    });
                });
                responseTime = Date.now() - startTime;
                if (status === 'down') error = 'Port unreachable';
            }
        } catch (err) {
            error = err.message;
            if (err.response) statusCode = err.response.status;
        }

        // Save check
        Check.create({
            monitor_id: monitor.id,
            status,
            response_time: responseTime,
            status_code: statusCode,
            error
        });

        // Update monitor status if changed
        if (monitor.status !== status) {
            Monitor.updateStatus(monitor.id, status);
        }

        // Handle Incidents
        const openIncident = Incident.getOpenByMonitor(monitor.id);

        if (status === 'down') {
            if (!openIncident) {
                // Here we could implement the "2 consecutive failures" logic by checking the last check.
                // For simplicity, let's create incident immediately or we can check last N checks.
                const recentChecks = Check.getRecentByMonitor(monitor.id, 2);
                if (recentChecks.length >= 2 && recentChecks[0].status === 'down' && recentChecks[1].status === 'down') {
                     // 2 consecutive failures met (since this new check makes it down and previous was down)
                     // Actually, if we just inserted this check, it is recentChecks[0].
                     // Let's create an incident.
                     const incidentId = Incident.create(monitor.id, error).lastInsertRowid;
                     const newIncident = { id: incidentId, started_at: Math.floor(Date.now() / 1000), error };
                     AlertService.handleDown(monitor, newIncident);
                }
            }
        } else if (status === 'up') {
            if (openIncident) {
                Incident.resolve(openIncident.id);
                openIncident.resolved_at = Math.floor(Date.now() / 1000);
                AlertService.handleUp(monitor, openIncident);
            }
        }
    }
}

module.exports = MonitorService;
