const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { signUser } = require('../utils/jwt');
const { buildCycle20 } = require('../utils/spinEngine');
const { normalizeAndValidatePhone } = require('../utils/phone');

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    balance: user.balance,
    createdAt: user.createdAt
  };
}

exports.register = asyncHandler(async (req, res) => {
  const { name, phone, password, confirmPassword } = req.body;

  if (!name || !phone || !password || !confirmPassword) {
    throw new ApiError(400, 'সব ঘর পূরণ করুন');
  }
  if (password !== confirmPassword) throw new ApiError(400, 'পাসওয়ার্ড মিলেনি');
  if (password.length < 6) throw new ApiError(400, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');

  const normalizedPhone = normalizeAndValidatePhone(phone);
  if (!normalizedPhone) throw new ApiError(400, 'সঠিক মোবাইল নম্বর দিন');

  const exists = await User.findOne({ phone: normalizedPhone });
  if (exists) throw new ApiError(400, 'আপনার এই নম্বরে একাউন্ট অলরেডি তৈরি করা আছে। অন্য নম্বর দিয়ে আবার চেষ্টা করুন।');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    phone: normalizedPhone,
    passwordHash,
    balance: 0,
    totalSpinCount: 0,
    spinCycle20: buildCycle20(),
    offer60Count: 0,
    offer100Count: 0,
    offerDelay: null
  });

  const token = signUser({ id: user._id, phone: user.phone, role: 'user' });
  res.status(201).json({ success: true, message: 'একাউন্ট তৈরি হয়েছে', token, user: sanitizeUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) throw new ApiError(400, 'মোবাইল নম্বর ও পাসওয়ার্ড দিন');

  const normalizedPhone = normalizeAndValidatePhone(phone);
  if (!normalizedPhone) throw new ApiError(400, 'সঠিক মোবাইল নম্বর দিন');

  const user = await User.findOne({ phone: normalizedPhone });
  if (!user) throw new ApiError(400, 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(400, 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড');

  const token = signUser({ id: user._id, phone: user.phone, role: 'user' });
  res.json({ success: true, message: 'লগইন সফল হয়েছে', token, user: sanitizeUser(user) });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});
