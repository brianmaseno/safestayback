const mongoose = require('mongoose');
const User = require('../models/User');
const Apartment = require('../models/Apartment');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const fixUsersApartmentName = async () => {
  try {
    console.log('🔄 Starting apartment name fix...');
    
    // Find users without apartmentName
    const usersWithoutApartmentName = await User.find({
      $or: [
        { apartmentName: { $exists: false } },
        { apartmentName: null },
        { apartmentName: '' }
      ]
    });

    console.log(`📊 Found ${usersWithoutApartmentName.length} users without apartmentName`);

    for (const user of usersWithoutApartmentName) {
      console.log(`🔧 Fixing user: ${user.name} (${user.email})`);
      
      if (user.role === 'Tenant' && user.apartmentId) {
        // For tenants, get apartment name from apartment document
        const apartment = await Apartment.findById(user.apartmentId);
        if (apartment) {
          user.apartmentName = apartment.name;
          await user.save();
          console.log(`✅ Updated tenant ${user.name} with apartment: ${apartment.name}`);
        } else {
          console.log(`❌ Apartment not found for tenant ${user.name}`);
        }
      } else if (user.role === 'Landlord') {
        // For landlords, find their apartment
        const apartment = await Apartment.findOne({ landlordId: user._id });
        if (apartment) {
          user.apartmentName = apartment.name;
          await user.save();
          console.log(`✅ Updated landlord ${user.name} with apartment: ${apartment.name}`);
        } else {
          console.log(`❌ Apartment not found for landlord ${user.name}`);
        }
      }
    }

    console.log('✅ Apartment name fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing apartment names:', error);
    process.exit(1);
  }
};

fixUsersApartmentName();
