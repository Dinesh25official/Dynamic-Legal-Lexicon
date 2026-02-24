require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════════════════╗
  ║   Dynamic Legal Lexicon API                        ║
  ║   Server running on http://localhost:${PORT}          ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
  ╚════════════════════════════════════════════════════╝
  `);
});
