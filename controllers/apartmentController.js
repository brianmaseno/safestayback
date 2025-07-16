const Apartment = require('../models/Apartment');
const User = require('../models/User');

// Get all available apartments for tenant selection
exports.getAvailableApartments = async (req, res) => {
  try {
    console.log('🏠 Fetching available apartments...');
    
    const apartments = await Apartment.find({ isActive: true })
      .populate('landlordId', 'name email')
      .sort({ name: 1 });
    
    console.log('📊 Found apartments:', apartments.length);
    
    res.status(200).json({
      success: true,
      data: apartments
    });
  } catch (error) {
    console.error('❌ Error fetching available apartments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create apartment (when landlord registers)
exports.createApartment = async (req, res) => {
  try {
    const { name, rentAmount, location, description, maxTenants } = req.body;
    const landlordId = req.user.id;
    
    // Check if apartment with same name already exists for this landlord
    const existingApartment = await Apartment.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      landlordId
    });
    
    if (existingApartment) {
      return res.status(400).json({
        success: false,
        message: 'You already have an apartment with this name'
      });
    }
    
    // Get landlord info
    const landlord = await User.findById(landlordId);
    
    const apartment = await Apartment.create({
      name,
      landlordId,
      landlordName: landlord.name,
      rentAmount,
      location,
      description,
      maxTenants
    });
    
    res.status(201).json({
      success: true,
      data: apartment
    });
  } catch (error) {
    console.error('Error creating apartment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get landlord's apartments
exports.getLandlordApartments = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const apartments = await Apartment.find({ landlordId })
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: apartments
    });
  } catch (error) {
    console.error('Error fetching landlord apartments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update apartment
exports.updateApartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const landlordId = req.user.id;
    
    const apartment = await Apartment.findOneAndUpdate(
      { _id: id, landlordId },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: 'Apartment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: apartment
    });
  } catch (error) {
    console.error('Error updating apartment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete apartment
exports.deleteApartment = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    
    const apartment = await Apartment.findOneAndDelete({ _id: id, landlordId });
    
    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: 'Apartment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Apartment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting apartment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get apartment by ID
exports.getApartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const apartment = await Apartment.findById(id)
      .populate('landlordId', 'name email primaryPhoneNumber');
    
    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: 'Apartment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: apartment
    });
  } catch (error) {
    console.error('Error fetching apartment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
