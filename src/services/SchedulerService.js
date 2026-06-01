const cron = require('node-cron');
const axios = require('axios');

class SchedulerService {
    static init() {
        if (process.env.RENDER_EXTERNAL_URL) {
            console.log(`Setting up Render Keep-Alive for ${process.env.RENDER_EXTERNAL_URL}`);
            cron.schedule('*/14 * * * *', async () => {
                try {
                    await axios.get(process.env.RENDER_EXTERNAL_URL);
                    console.log('Render Keep-Alive ping successful');
                } catch (e) {
                    console.error('Render Keep-Alive ping failed:', e.message);
                }
            });
        }
        console.log('Scheduler initialized.');
    }
}

module.exports = SchedulerService;
