const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    apartmentName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    month: { type: String, required: true }, // e.g., "January 2025"
    year: { type: Number, required: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
    paymentDate: { type: Date },
    paymentMethod: { type: String, enum: ['M-Pesa', 'PayPal', 'Cash', 'Other'], default: 'Other' },
    paymentHistory: [{
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      method: { type: String, enum: ['M-Pesa', 'PayPal', 'Cash', 'Other'], default: 'Cash' }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
