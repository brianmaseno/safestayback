const express = require('express');
const { 
  createTenant, 
  getAllTenants, 
  getTenantById, 
  updateTenant, 
  deleteTenant 
} = require('../controllers/tenantController');

const router = express.Router();

// Create a new tenant
// POST /api/tenants
router.post('/', createTenant);

// Get all tenants
// GET /api/tenants
router.get('/', getAllTenants);

// Get a single tenant by ID
// GET /api/tenants/:tenantId
router.get('/:tenantId', getTenantById);

// Update tenant info
// PUT /api/tenants/:tenantId
router.put('/:tenantId', updateTenant);

// Delete a tenant
// DELETE /api/tenants/:tenantId
router.delete('/:tenantId', deleteTenant);

module.exports = router;
