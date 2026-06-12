require('dotenv').config();
const app = require('./app');
const SchedulerService = require('./services/SchedulerService');
const TelegramService = require('./services/TelegramService');
const { verifyConnection } = require('./config/firebase');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`WatchTower Server running on port ${PORT}`);
    await verifyConnection();
    SchedulerService.init();
    TelegramService.init();
});
