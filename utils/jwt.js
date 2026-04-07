const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signUser(payload) {
  return jwt.sign(payload, env.JWT_USER_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function signAdmin(payload) {
  return jwt.sign(payload, env.JWT_ADMIN_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

module.exports = { signUser, signAdmin };
