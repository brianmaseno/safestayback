const mongoose = require('mongoose');

const rulesSchema = new mongoose.Schema({
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  apartmentName: { type: String, required: true, trim: true },
  rules: [{
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      enum: ['general', 'payment', 'noise', 'guests', 'pets', 'maintenance'],
      default: 'general'
    },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Rules', rulesSchema);
