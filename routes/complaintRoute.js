const express = require('express');
const { 
  createComplaint, 
  getAllComplaints, 
  getComplaintsByTenant, 
  getMyComplaints,
  updateComplaintStatus 
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/complaints
// @desc    Submit a new complaint (Tenant)
router.post('/', protect, createComplaint);

// @route   GET /api/complaints/me
// @desc    Get complaints for the current logged-in tenant
router.get('/me', protect, getMyComplaints);

// @route   GET /api/complaints
// @desc    Get all complaints (Landlord/Admin)
router.get('/', protect, getAllComplaints);

// @route   GET /api/complaints/tenant/:tenantId
// @desc    Get complaints by specific tenant
router.get('/tenant/:tenantId', protect, getComplaintsByTenant);

// @route   PUT /api/complaints/:complaintId
// @desc    Update complaint status (Landlord updates to In Progress or Resolved)
router.put('/:complaintId', protect, updateComplaintStatus);

module.exports = router;
