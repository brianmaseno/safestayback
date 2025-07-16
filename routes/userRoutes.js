const express = require('express');
const { getUserProfile, getAllTenants, getAllLandlords, updateRentAmount, getAllUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// 👉 Get logged-in user's profile (Protected)
router.get('/profile', protect, getUserProfile);

// 👉 Debug: Get all users (for debugging)
router.get('/all', protect, getAllUsers);

// 👉 Get all tenants (Landlord/Admin only) (Protected)
router.get('/tenants', protect, getAllTenants);

// 👉 Get all landlords (Tenant only) (Protected)
router.get('/landlords', protect, getAllLandlords);

// 👉 Update rent amount (Landlord only) (Protected)
router.put('/rent-amount', protect, updateRentAmount);

module.exports = router;
