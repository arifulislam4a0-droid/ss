const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    balance: { type: Number, default: 0, min: 0 },
    totalSpinCount: { type: Number, default: 0 },
    spinCycle20: { type: [String], default: [] },
    offer60Count: { type: Number, default: 0, min: 0, max: 10 },
    offer100Count: { type: Number, default: 0, min: 0, max: 10 },
    offerDelay: { type: Number, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
