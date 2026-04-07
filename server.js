const connectDB = require('./config/db');
const env = require('./config/env');
const app = require('./app');
const AppConfig = require('./models/AppConfig');

async function start() {
  await connectDB();
  await AppConfig.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: { key: 'main', bkashNumber: '0000', nagadNumber: '0000', globalSpinCycle20: [], globalSpinCount: 0 } },
    { upsert: true, new: true }
  );

  app.listen(env.PORT, () => {
    console.log(`সার্ভার চালু: http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('স্টার্টআপ সমস্যা:', err);
  process.exit(1);
});
