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
                const agent = new https.Agent({ rejectUnauthorized: false });
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
        await Check.create({
            monitor_id: monitor.id,
            status,
            response_time: responseTime,
            status_code: statusCode,
            error
        });

        // Update monitor status if changed
        if (monitor.status !== status) {
            await Monitor.updateStatus(monitor.id, status);
        }

        // Handle Incidents
        const openIncident = await Incident.getOpenByMonitor(monitor.id);

        if (status === 'down') {
            if (!openIncident) {
                const recentChecks = await Check.getRecentByMonitor(monitor.id, 2);
                if (recentChecks.length >= 2 && recentChecks[0].status === 'down' && recentChecks[1].status === 'down') {
                     const incidentId = await Incident.create(monitor.id, error);
                     const newIncident = { id: incidentId, started_at: Math.floor(Date.now() / 1000), error };
                     await AlertService.handleDown(monitor, newIncident);
                }
            }
        } else if (status === 'up') {
            if (openIncident) {
                await Incident.resolve(openIncident.id);
                openIncident.resolved_at = Math.floor(Date.now() / 1000);
                await AlertService.handleUp(monitor, openIncident);
            }
        }
        
        return { status, responseTime, error };
    }
}

module.exports = MonitorService;
