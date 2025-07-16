const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate Token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 👉 Register (Tenant or Landlord)
exports.registerUser = async (req, res) => {
  const { name, email, password, primaryPhoneNumber, secondaryPhoneNumber, nationalID, role, buildingName, dateMovedIn, apartmentName, rentAmount } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const newUser = await User.create({
      name,
      email,
      password,
      primaryPhoneNumber,
      secondaryPhoneNumber,
      nationalID,
      role,
      buildingName,
      dateMovedIn,
      apartmentName,
      rentAmount: role === 'Landlord' ? rentAmount : 0
    });

    const token = generateToken(newUser);

    res.status(201).json({
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        apartmentName: newUser.apartmentName
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        apartmentName: user.apartmentName
      },
      token
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Debug: Get all users (for debugging)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    console.log('📊 All users in database:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - Apartment: ${user.apartmentName}`);
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Get All Tenants (For Landlord - same apartment only)
exports.getAllTenants = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser.apartmentName) {
      return res.status(400).json({ message: 'User has no apartment assigned' });
    }

    let tenants;
    if (currentUser.role === 'Landlord') {
      // Landlord can only see tenants in their apartment
      tenants = await User.find({ 
        role: 'Tenant',
        apartmentName: new RegExp(`^${currentUser.apartmentName}$`, 'i')
      }).select('-password');
    } else {
      // Admin or other roles can see all tenants
      tenants = await User.find({ role: 'Tenant' }).select('-password');
    }

    res.status(200).json(tenants);
  } catch (error) {
    console.error('❌ Error in getAllTenants:', error);
    res.status(500).json({ error: error.message });
  }
};

// 👉 Get All Landlords (For Tenant - same apartment only)
exports.getAllLandlords = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let landlords;
    if (currentUser.role === 'Tenant') {
      // Tenant can only see landlord in their apartment
      landlords = await User.find({ 
        role: 'Landlord',
        apartmentName: new RegExp(currentUser.apartmentName, 'i')
      }).select('-password');
    } else {
      // Admin or other roles can see all landlords
      landlords = await User.find({ role: 'Landlord' }).select('-password');
    }

    res.status(200).json(landlords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Update Rent Amount (Landlord only)
exports.updateRentAmount = async (req, res) => {
  try {
    const { rentAmount } = req.body;
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can set rent amount' });
    }

    await User.findByIdAndUpdate(req.user._id, { rentAmount });

    res.status(200).json({ message: 'Rent amount updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
