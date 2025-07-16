const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  primaryPhoneNumber: { type: String, required: true },
  secondaryPhoneNumber: { type: String },

  nationalID: { type: String, required: true, unique: true },

  role: { 
    type: String, 
    enum: ['Tenant', 'Landlord'], 
    required: true 
  },

  // Apartment name (case-insensitive, required for both tenant and landlord)
  apartmentName: { type: String, required: true, trim: true },

  // Apartment ID reference (for tenants to properly link to apartment)
  apartmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Apartment',
    required: function() {
      return this.role === 'Tenant';
    }
  },

  // Landlord-specific field (optional)
  buildingName: { type: String },

  // Tenant-specific fields (optional)
  dateMovedIn: { type: Date },
  paidAmount: { type: Number, default: 0 },
  
  // Rent amount (set by landlord for their apartment)
  rentAmount: { type: Number, default: 0 },

}, { timestamps: true });

// 🔑 Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔑 Password compare method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🏠 Find users by apartment name (case-insensitive)
userSchema.statics.findByApartment = function(apartmentName) {
  return this.find({ apartmentName: new RegExp(apartmentName, 'i') });
};

// 🏠 Find tenants in same apartment (case-insensitive)
userSchema.statics.findTenantsByApartment = function(apartmentName) {
  return this.find({ 
    apartmentName: new RegExp(apartmentName, 'i'),
    role: 'Tenant' 
  });
};

// 🏠 Find landlord of apartment (case-insensitive)
userSchema.statics.findLandlordByApartment = function(apartmentName) {
  return this.findOne({ 
    apartmentName: new RegExp(apartmentName, 'i'),
    role: 'Landlord' 
  });
};

module.exports = mongoose.model('User', userSchema);
