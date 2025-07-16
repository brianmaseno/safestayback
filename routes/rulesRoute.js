const express = require('express');
const { addRules, getRules, updateRules, deleteRule } = require('../controllers/rulesController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/rules
// @desc    Add rules (Landlord only)
router.post('/', protect, addRules);

// @route   GET /api/rules
// @desc    Get rules for apartment
router.get('/', protect, getRules);

// @route   PUT /api/rules/:ruleId
// @desc    Update rule (Landlord only)
router.put('/:ruleId', protect, updateRules);

// @route   DELETE /api/rules/:ruleId
// @desc    Delete rule (Landlord only)
router.delete('/:ruleId', protect, deleteRule);

module.exports = router;
