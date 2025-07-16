const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { sendComplaintNotification } = require('../services/emailService');

// 👉 Create a new complaint (Tenant)
exports.createComplaint = async (req, res) => {
  const { title, description } = req.body;

  try {
    console.log('🚨 Creating complaint with data:', { title, description });
    console.log('🚨 User info:', req.user);

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Use req.user from auth middleware (must be a tenant)
    if (req.user.role !== 'Tenant') {
      return res.status(403).json({ message: 'Only tenants can create complaints' });
    }

    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🚨 Current user:', currentUser);

    // Find the landlord for this apartment
    const landlord = await User.findOne({
      apartmentName: new RegExp(currentUser.apartmentName, 'i'),
      role: 'Landlord'
    });

    console.log('🚨 Found landlord:', landlord);

    if (!landlord) {
      return res.status(404).json({ message: 'Landlord not found for this apartment' });
    }

    const complaint = new Complaint({
      tenant: req.user._id,
      landlord: landlord._id,
      apartmentName: currentUser.apartmentName,
      title,
      description,
      status: 'Pending',
      submittedAt: new Date()
    });

    console.log('🚨 About to save complaint:', complaint);

    await complaint.save();
    
    console.log('✅ Complaint saved successfully:', complaint);

    // Send email notification to landlord
    try {
      if (landlord) {
        await sendComplaintNotification(landlord, currentUser, complaint);
      }
    } catch (emailError) {
      console.error('Error sending complaint notification email:', emailError);
    }

    res.status(201).json({ 
      message: 'Complaint created successfully',
      complaint: complaint 
    });
  } catch (error) {
    console.error('❌ Error creating complaint:', error);
    res.status(500).json({ error: error.message });
  }
};

// 👉 Get all complaints (Landlord view - only for their apartment)
exports.getAllComplaints = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let complaints;
    if (currentUser.role === 'Landlord') {
      // Landlord can only see complaints for their apartment
      complaints = await Complaint.find({ 
        apartmentName: new RegExp(currentUser.apartmentName, 'i') 
      })
        .populate('tenant', 'name email nationalID role apartmentName')
        .populate('landlord', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Admin can see all complaints
      complaints = await Complaint.find()
        .populate('tenant', 'name email nationalID role apartmentName')
        .populate('landlord', 'name email')
        .sort({ createdAt: -1 });
    }

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Get complaints by Tenant ID
exports.getComplaintsByTenant = async (req, res) => {
  const { tenantId } = req.params;

  try {
    const complaints = await Complaint.find({ tenant: tenantId })
      .populate('tenant', 'name email nationalID role')
      .sort({ createdAt: -1 });

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Get complaints for the current logged-in tenant
exports.getMyComplaints = async (req, res) => {
  try {
    if (req.user.role !== 'Tenant') {
      return res.status(403).json({ message: 'Only tenants can view their complaints' });
    }

    const complaints = await Complaint.find({ tenant: req.user._id })
      .populate('tenant', 'name email nationalID role apartmentName')
      .populate('landlord', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Update complaint status (Landlord updates)
exports.updateComplaintStatus = async (req, res) => {
  const { complaintId } = req.params;
  const { status, landlordNotes } = req.body;

  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser || currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can update complaint status' });
    }

    const complaint = await Complaint.findById(complaintId);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Verify landlord can only update complaints for their apartment
    if (complaint.apartmentName.toLowerCase() !== currentUser.apartmentName.toLowerCase()) {
      return res.status(403).json({ message: 'You can only update complaints for your apartment' });
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        status,
        landlordNotes,
        resolvedAt: status === 'Completed' ? new Date() : null
      },
      { new: true }
    )
      .populate('tenant', 'name email nationalID role apartmentName')
      .populate('landlord', 'name email');

    // Send email notification to tenant about status change
    try {
      const tenant = await User.findById(complaint.tenantId);
      if (tenant) {
        await sendComplaintNotification(req.user, tenant, updatedComplaint);
      }
    } catch (emailError) {
      console.error('Error sending complaint status notification email:', emailError);
    }

    res.status(200).json({
      message: 'Complaint status updated successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
