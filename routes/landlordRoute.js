const express = require('express');
const { createLandlord, getLandlord, updateLandlord, deleteLandlord } = require('../controllers/landlordController');

const router = express.Router();

router.post('/', createLandlord);
router.get('/', getLandlord);
router.put('/', updateLandlord);
router.delete('/', deleteLandlord);

module.exports = router;
