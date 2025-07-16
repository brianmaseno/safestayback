const express = require('express');
const {
  generateMonthlyBills,
  getBillsForApartment,
  makeCashPayment,
  getMyBills,
  getUnpaidBills,
  getPaidBills,
  updateBill,
  downloadBillPDF,
  downloadPaymentReceiptPDF
} = require('../controllers/billsController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Protected: Generate monthly bills (Landlord only)
router.post('/generate-monthly', protect, generateMonthlyBills);

// ✅ Protected: Get logged-in tenant's bills
router.get('/me', protect, getMyBills);

// ✅ Protected: Get all bills for landlord's apartment
router.get('/apartment', protect, getBillsForApartment);

// ✅ Protected: Get unpaid bills (Landlord only)
router.get('/unpaid', protect, getUnpaidBills);

// ✅ Protected: Get paid bills (Landlord only)
router.get('/paid', protect, getPaidBills);

// ✅ Protected: Make cash payment (Tenant only)
router.post('/pay-cash', protect, makeCashPayment);

// ✅ Protected: Update bill (Landlord only)
router.put('/:billId', protect, updateBill);

// ✅ Protected: Download bill as PDF
router.get('/download/:billId', protect, downloadBillPDF);

// ✅ Protected: Download payment receipt as PDF
router.get('/download-receipt/:billId/:paymentIndex', protect, downloadPaymentReceiptPDF);

module.exports = router;
