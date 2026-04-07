const bcrypt = require('bcryptjs');
const Transaction = require('../models/Transaction');
const AppConfig = require('../models/AppConfig');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { nextSpin } = require('../utils/spinEngine');
const { normalizeAndValidatePhone } = require('../utils/phone');

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

exports.profile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      balance: req.user.balance
    }
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) throw new ApiError(400, 'সব ঘর পূরণ করুন');
  if (newPassword !== confirmPassword) throw new ApiError(400, 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলেনি');
  if (newPassword.length < 6) throw new ApiError(400, 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');

  const ok = await bcrypt.compare(oldPassword, req.user.passwordHash);
  if (!ok) throw new ApiError(400, 'পুরাতন পাসওয়ার্ড সঠিক নয়');

  req.user.passwordHash = await bcrypt.hash(newPassword, 10);
  await req.user.save();

  res.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন হয়েছে' });
});

exports.paymentMethods = asyncHandler(async (req, res) => {
  const config = await getConfig();
  res.json({
    success: true,
    methods: {
      bkash: config.bkashNumber,
      nagad: config.nagadNumber
    }
  });
});

exports.createDeposit = asyncHandler(async (req, res) => {
  const { method, senderNumber, amount } = req.body;
  if (!method || !senderNumber || !amount) throw new ApiError(400, 'সব তথ্য দিন');
  if (!['bkash', 'nagad'].includes(method)) throw new ApiError(400, 'সঠিক পেমেন্ট মেথড দিন');
  if (Number(amount) < 50) throw new ApiError(400, 'মিনিমাম ডিপোজিট ৫০ টাকা');

  const normalizedSender = normalizeAndValidatePhone(senderNumber);
  if (!normalizedSender) throw new ApiError(400, 'সঠিক মোবাইল নম্বর দিন');

  const config = await getConfig();
  const merchantNumber = method === 'bkash' ? config.bkashNumber : config.nagadNumber;

  const transaction = await Transaction.create({
    type: 'deposit',
    status: 'processing',
    user: req.user._id,
    userName: req.user.name,
    userPhone: req.user.phone,
    method,
    merchantNumber,
    senderNumber: normalizedSender,
    amount: Number(amount),
    previousBalance: req.user.balance,
    resultingBalance: req.user.balance,
    note: 'অপেক্ষা করুন এডমিন দ্রুত সময়ে আপনার ব্যালেন্স এ টাকাটি যুক্ত করে দিবে'
  });

  res.status(201).json({ success: true, message: 'ডিপোজিট রিকোয়েস্ট নেওয়া হয়েছে', transaction });
});

exports.createWithdraw = asyncHandler(async (req, res) => {
  const { method, receiverNumber, amount } = req.body;
  if (!method || !receiverNumber || !amount) throw new ApiError(400, 'সব তথ্য দিন');
  if (!['bkash', 'nagad'].includes(method)) throw new ApiError(400, 'সঠিক পেমেন্ট মেথড দিন');

  const normalizedReceiver = normalizeAndValidatePhone(receiverNumber);
  if (!normalizedReceiver) throw new ApiError(400, 'সঠিক মোবাইল নম্বর দিন');

  const numericAmount = Number(amount);
  if (numericAmount < 60) throw new ApiError(400, 'মিনিমাম উইড্র ৬০ টাকা');
  if (req.user.balance < numericAmount) throw new ApiError(400, 'আপনার ব্যালেন্সে পর্যাপ্ত টাকা নেই');

  const previousBalance = req.user.balance;
  req.user.balance -= numericAmount;
  await req.user.save();

  const transaction = await Transaction.create({
    type: 'withdraw',
    status: 'processing',
    user: req.user._id,
    userName: req.user.name,
    userPhone: req.user.phone,
    method,
    receiverNumber: normalizedReceiver,
    amount: numericAmount,
    previousBalance,
    resultingBalance: req.user.balance,
    note: 'আপনার টাকাটি দ্রুত সময়ে এডমিন দিয়ে দিবেন। দয়া করে অপেক্ষা করুন।'
  });

  res.status(201).json({
    success: true,
    message: 'উইড্র রিকোয়েস্ট নেওয়া হয়েছে',
    balance: req.user.balance,
    transaction
  });
});

exports.transactions = asyncHandler(async (req, res) => {
  const list = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, transactions: list });
});

exports.spin = asyncHandler(async (req, res) => {
  if (req.user.balance < 20) {
    throw new ApiError(400, 'দুঃখিত আপনার ব্যালেন্স ২০ টাকার কম। দয়া করে ডিপোজিট করে আবার চেষ্টা করুন।');
  }

  const config = await getConfig();
  const spinResult = nextSpin(req.user, config);
  const previousBalance = req.user.balance;
  req.user.balance = req.user.balance - 20 + spinResult.amount;
  req.user.totalSpinCount += 1;
  if (!spinResult.isOffer) {
    config.globalSpinCount = (config.globalSpinCount || 0) + 1;
  }

  await Promise.all([req.user.save(), config.save()]);

  await Transaction.create({
    type: 'spin',
    status: 'success',
    user: req.user._id,
    userName: req.user.name,
    userPhone: req.user.phone,
    amount: spinResult.amount,
    previousBalance,
    resultingBalance: req.user.balance,
    spinPrizeLabel: spinResult.prize,
    spinCost: 20,
    note: 'স্পিন সম্পন্ন হয়েছে'
  });

  res.json({
    success: true,
    message: `আপনি পেয়েছেন: ${spinResult.prize}`,
    result: {
      label: spinResult.prize,
      amount: spinResult.amount,
      cost: 20
    },
    balance: req.user.balance,
    minSpinMs: 3200
  });
});
