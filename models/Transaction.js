const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['deposit', 'withdraw', 'spin'],
      required: true
    },
    status: {
      type: String,
      enum: ['processing', 'success', 'cancelled'],
      default: 'processing'
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    method: { type: String, enum: ['bkash', 'nagad', null], default: null },
    merchantNumber: { type: String, default: '' },
    senderNumber: { type: String, default: '' },
    receiverNumber: { type: String, default: '' },
    amount: { type: Number, required: true },
    previousBalance: { type: Number, default: 0 },
    resultingBalance: { type: Number, default: 0 },
    note: { type: String, default: '' },
    spinPrizeLabel: { type: String, default: '' },
    spinCost: { type: Number, default: 0 },
    processedAt: { type: Date },
    processedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
