const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    bkashNumber: { type: String, default: '0000' },
    nagadNumber: { type: String, default: '0000' },
    globalSpinCycle20: { type: [String], default: [] },
    globalSpinCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppConfig', appConfigSchema);
