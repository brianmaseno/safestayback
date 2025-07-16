const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  apartmentName: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  submittedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  landlordNotes: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
