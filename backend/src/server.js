require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const config = require('./config');

const start = async () => {
  await connectDB();
  if (config.irancellShop.devMode) {
    console.warn(
      '⚠️  IRANCELL_SHOP_DEV_MODE=true — فقط ۴ شماره تستی در استعلام ایرانسل «موجود» نشان داده می‌شوند!'
    );
  } else {
    console.log('Irancell shop lookup: live API (DEV_MODE off)');
  }
  const server = app.listen(config.port, config.host, () => {
    console.log(`Server running on ${config.host}:${config.port}`);
  });
  // Excel + Irancell lookup for large files can take several minutes
  server.timeout = 15 * 60 * 1000;
  server.requestTimeout = 15 * 60 * 1000;
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
