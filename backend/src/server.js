require('dotenv').config();
const app = require('./app');
const { initDailyTermScheduler } = require('./modules/lexicon/jobs/dailyTermScheduler');

const PORT = process.env.PORT || 5000;

// Initialize Schedulers
initDailyTermScheduler();

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════╗
  ║   Dynamic Legal Lexicon API                        ║
  ║   Server running on http://localhost:${PORT}          ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
  ╚════════════════════════════════════════════════════╝
  `);
});
