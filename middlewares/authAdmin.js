const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) throw new ApiError(401, 'এডমিন লগইন প্রয়োজন');

  const decoded = jwt.verify(token, env.JWT_ADMIN_SECRET);
  if (!decoded || decoded.role !== 'admin') throw new ApiError(403, 'অনুমতি নেই');

  req.admin = decoded;
  next();
});
