const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) throw new ApiError(401, 'লগইন প্রয়োজন');

  const decoded = jwt.verify(token, env.JWT_USER_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'ইউজার পাওয়া যায়নি');

  req.user = user;
  next();
});
