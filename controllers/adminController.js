const bcrypt = require('bcryptjs');
const env = require('../config/env');
const AppConfig = require('../models/AppConfig');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeAndValidatePhone } = require('../utils/phone');
const { signAdmin } = require('../utils/jwt');

async function getConfig() {
  let config = await AppConfig.findOne({ key: 'main' });
  if (!config) {
    config = await AppConfig.create({
      key: 'main',
      bkashNumber: '0000',
      nagadNumber: '0000',
      globalSpinCycle20: [],
      globalSpinCount: 0
    });
  }
  if (!Array.isArray(config.globalSpinCycle20)) config.globalSpinCycle20 = [];
  if (typeof config.globalSpinCount !== 'number') config.globalSpinCount = 0;
  return config;
}

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw new ApiError(400, 'ইউজারনেম ও পাসওয়ার্ড দিন');

  if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
    throw new ApiError(401, 'এডমিন লগইন তথ্য সঠিক নয়');
  }

  const token = signAdmin({ role: 'admin', username: env.ADMIN_USERNAME });
  res.json({ success: true, message: 'এডমিন লগইন সফল হয়েছে', token, admin: { username: env.ADMIN_USERNAME } });
});

exports.dashboard = asyncHandler(async (req, res) => {
  const [depositAgg, withdrawAgg, config] = await Promise.all([
    Transaction.aggregate([{ $match: { type: 'deposit', status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Transaction.aggregate([{ $match: { type: 'withdraw', status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    getConfig()
  ]);

  res.json({
    success: true,
    stats: {
      totalDeposit: depositAgg[0]?.total || 0,
      totalWithdraw: withdrawAgg[0]?.total || 0
    },
    methods: {
      bkash: config.bkashNumber,
      nagad: config.nagadNumber
    }
  });
});

exports.updatePaymentMethods = asyncHandler(async (req, res) => {
  const { bkashNumber, nagadNumber, adminPassword } = req.body;
  if (!adminPassword) throw new ApiError(400, 'এডমিন পাসওয়ার্ড দিন');
  if (adminPassword !== env.ADMIN_PASSWORD) throw new ApiError(401, 'এডমিন পাসওয়ার্ড ভুল');

  const config = await getConfig();
  if (typeof bkashNumber === 'string') config.bkashNumber = bkashNumber.trim() || '0000';
  if (typeof nagadNumber === 'string') config.nagadNumber = nagadNumber.trim() || '0000';
  await config.save();

  res.json({
    success: true,
    message: 'পেমেন্ট নম্বর আপডেট হয়েছে',
    methods: { bkash: config.bkashNumber, nagad: config.nagadNumber }
  });
});

exports.findUserOffer = asyncHandler(async (req, res) => {
  const { phone } = req.query;
  if (!phone) throw new ApiError(400, 'ইউজারের ফোন নম্বর দিন');
  const normalizedPhone = normalizeAndValidatePhone(phone);
  if (!normalizedPhone) throw new ApiError(400, 'সঠিক মোবাইল নম্বর দিন');

  const user = await User.findOne({ phone: normalizedPhone });
  if (!user) throw new ApiError(404, 'ইউজার পাওয়া যায়নি');

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      offer60Count: Number(user.offer60Count || 0),
      offer100Count: Number(user.offer100Count || 0)
    }
  });
});

exports.updateUserOffer = asyncHandler(async (req, res) => {
  const { adminPassword, offer60Count, offer100Count } = req.body;
  const { id } = req.params;
  if (!adminPassword) throw new ApiError(400, 'এডমিন পাসওয়ার্ড দিন');
  if (adminPassword !== env.ADMIN_PASSWORD) throw new ApiError(401, 'এডমিন পাসওয়ার্ড ভুল');
  if (offer60Count == null || offer100Count == null) throw new ApiError(400, 'দুইটি অফারের সংখ্যা দিন');

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'ইউজার পাওয়া যায়নি');

  const count60 = Number(offer60Count);
  const count100 = Number(offer100Count);
  if (!Number.isInteger(count60) || count60 < 0 || count60 > 10) throw new ApiError(400, '৬০ টাকার অফার সংখ্যা 0-10 এর মধ্যে হতে হবে');
  if (!Number.isInteger(count100) || count100 < 0 || count100 > 10) throw new ApiError(400, '১০০ টাকার অফার সংখ্যা 0-10 এর মধ্যে হতে হবে');

  user.offer60Count = count60;
  user.offer100Count = count100;
  user.offerDelay = null;
  await user.save();

  res.json({
    success: true,
    message: 'অফার আপডেট হয়েছে',
    offers: { offer60Count: user.offer60Count, offer100Count: user.offer100Count }
  });
});

exports.requests = asyncHandler(async (req, res) => {
  const { filter } = req.query;
  const query = { type: { $in: ['deposit', 'withdraw'] } };

  const mapping = {
    processing_deposit: { type: 'deposit', status: 'processing' },
    processing_withdraw: { type: 'withdraw', status: 'processing' },
    success_deposit: { type: 'deposit', status: 'success' },
    success_withdraw: { type: 'withdraw', status: 'success' },
    cancelled_deposit: { type: 'deposit', status: 'cancelled' },
    cancelled_withdraw: { type: 'withdraw', status: 'cancelled' }
  };

  const merged = mapping[filter];
  if (merged) Object.assign(query, merged);

  const list = await Transaction.find(query).sort({ createdAt: -1 });
  res.json({ success: true, requests: list });
});

exports.processDeposit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, okText } = req.body;
  if (!action || !okText) throw new ApiError(400, 'অ্যাকশন ও ok লিখুন');
  if (String(okText).trim().toUpperCase() !== 'OK') throw new ApiError(400, 'কনফার্ম করার জন্য ok লিখুন');

  const transaction = await Transaction.findById(id);
  if (!transaction || transaction.type !== 'deposit') throw new ApiError(404, 'ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি');
  if (transaction.status !== 'processing') throw new ApiError(400, 'এই রিকোয়েস্ট আগে প্রসেস করা হয়েছে');

  if (action === 'cancel') {
    transaction.status = 'cancelled';
    transaction.processedAt = new Date();
    transaction.processedBy = req.admin.username;
    await transaction.save();
    return res.json({ success: true, message: 'ডিপোজিট বাতিল করা হয়েছে' });
  }

  if (action !== 'confirm') throw new ApiError(400, 'সঠিক অ্যাকশন দিন');

  const user = await User.findById(transaction.user);
  if (!user) throw new ApiError(404, 'ইউজার পাওয়া যায়নি');

  user.balance += transaction.amount;
  await user.save();

  transaction.status = 'success';
  transaction.previousBalance = user.balance - transaction.amount;
  transaction.resultingBalance = user.balance;
  transaction.processedAt = new Date();
  transaction.processedBy = req.admin.username;
  await transaction.save();

  res.json({ success: true, message: 'ডিপোজিট কনফার্ম করা হয়েছে', balance: user.balance });
});

exports.processWithdraw = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, okText } = req.body;
  if (!action || !okText) throw new ApiError(400, 'অ্যাকশন ও ok লিখুন');
  if (String(okText).trim().toUpperCase() !== 'OK') throw new ApiError(400, 'কনফার্ম করার জন্য ok লিখুন');

  const transaction = await Transaction.findById(id);
  if (!transaction || transaction.type !== 'withdraw') throw new ApiError(404, 'উইড্র রিকোয়েস্ট পাওয়া যায়নি');
  if (transaction.status !== 'processing') throw new ApiError(400, 'এই রিকোয়েস্ট আগে প্রসেস করা হয়েছে');

  const user = await User.findById(transaction.user);
  if (!user) throw new ApiError(404, 'ইউজার পাওয়া যায়নি');

  if (action === 'cancel') {
    user.balance += transaction.amount;
    await user.save();

    transaction.status = 'cancelled';
    transaction.resultingBalance = user.balance;
    transaction.processedAt = new Date();
    transaction.processedBy = req.admin.username;
    await transaction.save();

    return res.json({ success: true, message: 'উইড্র বাতিল করা হয়েছে এবং ব্যালেন্স ফেরত দেওয়া হয়েছে', balance: user.balance });
  }

  if (action !== 'complete') throw new ApiError(400, 'সঠিক অ্যাকশন দিন');

  transaction.status = 'success';
  transaction.processedAt = new Date();
  transaction.processedBy = req.admin.username;
  await transaction.save();

  res.json({ success: true, message: 'উইড্র সম্পন্ন করা হয়েছে' });
});
