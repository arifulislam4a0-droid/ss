const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://arifulislam4a0_db_user:OihDArOkqhHmi0q2@cluster0.br1v7hq.mongodb.net/?appName=Cluster0',
  CLIENT_BASE_URL: process.env.CLIENT_BASE_URL || '*',
  ADMIN_BASE_URL: process.env.ADMIN_BASE_URL || '*',
  JWT_USER_SECRET: process.env.JWT_USER_SECRET || 'change_thrtyrtutycvdfy5645756767is_user_secret',
  JWT_ADMIN_SECRET: process.env.JWT_ADMIN_SECRET || 'chanerterty56767tyu68678i76ge_this_admin_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '365d',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'web-admin123',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'a@pweb_admin5@'
};