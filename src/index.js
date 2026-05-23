const app = require('./app');
const SchedulerService = require('./services/SchedulerService');
const TelegramService = require('./services/TelegramService');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`WatchTower Server running on port ${PORT}`);
    
    // Initialize services
    SchedulerService.init();
    TelegramService.init();
});
