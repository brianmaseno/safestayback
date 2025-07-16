const Bill = require('../models/Bills');
const User = require('../models/User');
const { sendMonthlyBillNotification, sendPaymentConfirmation } = require('../services/emailService');

// Generate monthly bills for all tenants in landlord's apartment
exports.generateMonthlyBills = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser || currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can generate bills' });
    }

    const { month, year, dueDate } = req.body;

    // Find all tenants in the same apartment
    const tenants = await User.find({
      apartmentName: new RegExp(currentUser.apartmentName, 'i'),
      role: 'Tenant'
    });

    if (tenants.length === 0) {
      return res.status(404).json({ message: 'No tenants found in this apartment' });
    }

    const bills = [];
    
    for (const tenant of tenants) {
      // Check if bill already exists for this month
      const existingBill = await Bill.findOne({
        tenant: tenant._id,
        month,
        year
      });

      if (!existingBill) {
        const newBill = await Bill.create({
          tenant: tenant._id,
          landlord: currentUser._id,
          apartmentName: currentUser.apartmentName,
          amount: currentUser.rentAmount,
          remainingAmount: currentUser.rentAmount,
          dueDate,
          month,
          year,
          description: `Monthly rent for ${month} ${year}`
        });

        bills.push(newBill);
        
        // Send email notification to tenant
        try {
          await sendMonthlyBillNotification(tenant, newBill);
        } catch (emailError) {
          console.error('Error sending bill notification email:', emailError);
        }
      }
    }

    res.status(201).json({ 
      message: `Generated ${bills.length} bills for ${month} ${year}`,
      bills 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all bills for landlord's apartment
exports.getBillsForApartment = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser || currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can view apartment bills' });
    }

    const bills = await Bill.find({ 
      apartmentName: new RegExp(currentUser.apartmentName, 'i') 
    })
      .populate('tenant', 'name nationalID')
      .populate('landlord', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get tenant's bills
exports.getMyBills = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser || currentUser.role !== 'Tenant') {
      return res.status(403).json({ message: 'Only tenants can view their bills' });
    }

    const bills = await Bill.find({ tenant: req.user._id })
      .populate('tenant', 'name nationalID')
      .populate('landlord', 'name')
      .sort({ dueDate: -1 });

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Make cash payment (tenant)
exports.makeCashPayment = async (req, res) => {
  try {
    const { billId, amount } = req.body;
    const currentUser = await User.findById(req.user._id);

    if (!currentUser || currentUser.role !== 'Tenant') {
      return res.status(403).json({ message: 'Only tenants can make payments' });
    }

    const bill = await Bill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only pay your own bills' });
    }

    if (amount > bill.remainingAmount) {
      return res.status(400).json({ message: 'Payment amount exceeds remaining balance' });
    }

    // Update bill
    bill.paidAmount += amount;
    bill.remainingAmount -= amount;
    
    if (bill.remainingAmount === 0) {
      bill.status = 'Paid';
      bill.paymentDate = new Date();
    } else {
      bill.status = 'Partial';
    }

    // Add to payment history
    bill.paymentHistory.push({
      amount,
      date: new Date(),
      method: 'Cash'
    });

    await bill.save();

    res.status(200).json({ 
      message: 'Payment recorded successfully',
      bill 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get unpaid bills for landlord's apartment
exports.getUnpaidBills = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser || currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can view unpaid bills' });
    }

    const unpaidBills = await Bill.find({ 
      apartmentName: new RegExp(currentUser.apartmentName, 'i'),
      status: { $in: ['Pending', 'Partial'] }
    })
      .populate('tenant', 'name nationalID')
      .populate('landlord', 'name')
      .sort({ dueDate: 1 });

    res.status(200).json(unpaidBills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get paid bills for landlord's apartment
exports.getPaidBills = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser || currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can view paid bills' });
    }

    const paidBills = await Bill.find({ 
      apartmentName: new RegExp(currentUser.apartmentName, 'i'),
      status: 'Paid'
    })
      .populate('tenant', 'name nationalID')
      .populate('landlord', 'name')
      .sort({ paymentDate: -1 });

    res.status(200).json(paidBills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update bill (landlord only)
exports.updateBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { amount, description, dueDate } = req.body;
    const currentUser = await User.findById(req.user._id);

    if (!currentUser || currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can update bills' });
    }

    const bill = await Bill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Check if landlord can update this bill (same apartment)
    if (bill.apartmentName.toLowerCase() !== currentUser.apartmentName.toLowerCase()) {
      return res.status(403).json({ message: 'You can only update bills for your apartment' });
    }

    // Update the bill
    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      {
        amount: parseFloat(amount),
        description,
        dueDate: new Date(dueDate),
        remainingAmount: bill.paidAmount > 0 ? parseFloat(amount) - bill.paidAmount : parseFloat(amount)
      },
      { new: true }
    )
      .populate('tenant', 'name nationalID')
      .populate('landlord', 'name');

    res.status(200).json({ 
      message: 'Bill updated successfully',
      bill: updatedBill 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download bill as PDF
exports.downloadBillPDF = async (req, res) => {
  try {
    const { billId } = req.params;
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bill = await Bill.findById(billId)
      .populate('tenant', 'name nationalID email')
      .populate('landlord', 'name email');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Check if user can access this bill
    if (currentUser.role === 'Tenant' && bill.tenant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only download your own bills' });
    }

    if (currentUser.role === 'Landlord' && bill.apartmentName.toLowerCase() !== currentUser.apartmentName.toLowerCase()) {
      return res.status(403).json({ message: 'You can only download bills for your apartment' });
    }

    const { generateBillPDF } = require('../utils/pdfGenerator');
    const doc = generateBillPDF(bill, bill.tenant);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${bill.month}-${bill.year}.pdf`);

    // Pipe the PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download payment receipt as PDF
exports.downloadPaymentReceiptPDF = async (req, res) => {
  try {
    const { billId, paymentIndex } = req.params;
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bill = await Bill.findById(billId)
      .populate('tenant', 'name nationalID email')
      .populate('landlord', 'name email');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Check if user can access this bill
    if (currentUser.role === 'Tenant' && bill.tenant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only download your own payment receipts' });
    }

    const payment = bill.paymentHistory[paymentIndex];
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const { generatePaymentReceiptPDF } = require('../utils/pdfGenerator');
    const doc = generatePaymentReceiptPDF(payment, bill, bill.tenant);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${new Date(payment.date).toISOString().split('T')[0]}.pdf`);

    // Pipe the PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
