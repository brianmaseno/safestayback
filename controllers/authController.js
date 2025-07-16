const User = require('../models/User');
const Apartment = require('../models/Apartment');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (user) => {
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'Not found');
  console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ✅ Register User (Tenant or Landlord)
exports.registerUser = async (req, res) => {
  const { name, email, password, nationalID, primaryPhoneNumber, secondaryPhoneNumber, role, apartmentName, apartmentId, rentAmount, dateMovedIn } = req.body;

  try {
    // Validate required fields
    if (!apartmentName) {
      return res.status(400).json({ message: 'Apartment name is required' });
    }

    if (role === 'Landlord' && !rentAmount) {
      return res.status(400).json({ message: 'Rent amount is required for landlords' });
    }

    if (role === 'Tenant' && !apartmentId) {
      return res.status(400).json({ message: 'Please select an apartment' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if nationalID already exists
    const existingNationalID = await User.findOne({ nationalID });
    if (existingNationalID) {
      return res.status(400).json({ message: 'National ID already registered' });
    }

    let apartment = null;
    let userData = {
      name,
      email,
      password,
      nationalID,
      primaryPhoneNumber,
      secondaryPhoneNumber,
      role,
      apartmentName,
      dateMovedIn
    };

    if (role === 'Landlord') {
      // Add rent amount for landlords
      userData.rentAmount = rentAmount;
      
      // For landlords, we need to create the user first, then create the apartment
      // Create user first
      const newUser = await User.create(userData);
      
      // Then create apartment with the user ID
      apartment = await Apartment.create({
        name: apartmentName,
        landlordId: newUser._id,
        landlordName: name,
        rentAmount,
        isActive: true
      });
      
      // Generate token and return response
      const token = generateToken(newUser);

      return res.status(201).json({
        message: 'Registration successful',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          nationalID: newUser.nationalID,
          primaryPhoneNumber: newUser.primaryPhoneNumber,
          secondaryPhoneNumber: newUser.secondaryPhoneNumber,
          apartmentName: newUser.apartmentName,
          apartmentId: apartment._id,
          rentAmount: newUser.rentAmount,
          dateMovedIn: newUser.dateMovedIn
        },
        token
      });
    } else {
      // Tenant: verify apartment exists and get apartment details
      apartment = await Apartment.findById(apartmentId);
      if (!apartment) {
        return res.status(400).json({ message: 'Selected apartment not found' });
      }
      
      userData.apartmentId = apartmentId;
      userData.apartmentName = apartment.name; // Use the exact apartment name
      
      // Create user
      const newUser = await User.create(userData);
      
      // Increment tenant count
      await Apartment.findByIdAndUpdate(apartmentId, {
        $inc: { currentTenants: 1 }
      });
      
      // Generate token and return response
      const token = generateToken(newUser);

      return res.status(201).json({
        message: 'Registration successful',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          nationalID: newUser.nationalID,
          primaryPhoneNumber: newUser.primaryPhoneNumber,
          secondaryPhoneNumber: newUser.secondaryPhoneNumber,
          apartmentName: newUser.apartmentName,
          apartmentId: newUser.apartmentId,
          rentAmount: newUser.rentAmount,
          dateMovedIn: newUser.dateMovedIn
        },
        token
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password using the model method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        nationalID: user.nationalID,
        primaryPhoneNumber: user.primaryPhoneNumber,
        secondaryPhoneNumber: user.secondaryPhoneNumber,
        apartmentName: user.apartmentName,
        rentAmount: user.rentAmount,
        dateMovedIn: user.dateMovedIn
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};
