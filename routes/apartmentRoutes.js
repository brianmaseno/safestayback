const express = require('express');
const router = express.Router();
const {
  getAvailableApartments,
  createApartment,
  getLandlordApartments,
  updateApartment,
  deleteApartment,
  getApartmentById
} = require('../controllers/apartmentController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/available', getAvailableApartments);
router.get('/:id', getApartmentById);

// Protected routes (require authentication)
router.use(protect);

// Landlord routes
router.post('/', createApartment);
router.get('/landlord/my-apartments', getLandlordApartments);
router.put('/:id', updateApartment);
router.delete('/:id', deleteApartment);

module.exports = router;
