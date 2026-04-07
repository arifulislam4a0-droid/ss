const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'অতিরিক্ত রিকোয়েস্ট করা হয়েছে, একটু পরে চেষ্টা করুন' }
});

module.exports = { apiLimiter };
