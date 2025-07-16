const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlordName: {
    type: String,
    required: true
  },
  rentAmount: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  maxTenants: {
    type: Number,
    default: 10
  },
  currentTenants: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create index for case-insensitive apartment name search
apartmentSchema.index({ name: 1, landlordId: 1 }, { unique: true });

module.exports = mongoose.model('Apartment', apartmentSchema);
