const cron = require('node-cron');
const dailyTermModel = require('../models/dailyTerm.model');

/**
 * Daily Term Scheduler
 * Runs every day at midnight (00:00:00) IST.
 * IST is UTC+5:30.
 */
const initDailyTermScheduler = () => {
    console.log('📅 Daily Term Scheduler Initialized');

    // Run every day at midnight IST
    // IST = UTC+5:30. In cron '0 0 * * *' runs at midnight server time.
    // If server is in IST, this works. For generic UTC, IST midnight is 18:30 UTC.
    // We'll use '0 0 * * *' assuming local time or configured timezone.
    cron.schedule('0 0 * * *', async () => {
        console.log('🔄 Rotating Daily Term...');
        try {
            const rotated = await dailyTermModel.rotateDailyTerm();
            if (rotated) {
                console.log(`✅ Daily Term rotated to: ${rotated.legal_term}`);
            } else {
                console.log('⚠️ Rotation failed: Daily Pool is empty.');
            }
        } catch (error) {
            console.error('❌ Daily Term rotation error:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Set to IST
    });
};

module.exports = { initDailyTermScheduler };
