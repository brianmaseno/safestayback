const Rules = require('../models/Rules');
const User = require('../models/User');
const { sendNewRuleNotification } = require('../services/emailService');

// 👉 Add rules (Landlord only)
exports.addRules = async (req, res) => {
  const { rules } = req.body; // Array of rule objects

  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser || currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can add rules' });
    }

    // Find existing rules for this apartment or create new
    let apartmentRules = await Rules.findOne({
      apartmentName: new RegExp(currentUser.apartmentName, 'i'),
      landlord: currentUser._id
    });

    if (!apartmentRules) {
      apartmentRules = new Rules({
        landlord: currentUser._id,
        apartmentName: currentUser.apartmentName,
        rules: []
      });
    }

    // Add new rules
    apartmentRules.rules.push(...rules);
    await apartmentRules.save();

    // Send email notification to all tenants in the apartment
    try {
      const tenants = await User.find({ 
        role: 'Tenant', 
        apartmentName: new RegExp(currentUser.apartmentName, 'i') 
      });
      
      for (const tenant of tenants) {
        for (const rule of rules) {
          await sendNewRuleNotification(tenant, {
            title: rule.title,
            description: rule.description,
            apartmentName: currentUser.apartmentName
          });
        }
      }
    } catch (emailError) {
      console.error('Error sending rule notification emails:', emailError);
    }

    res.status(201).json({
      message: 'Rules added successfully',
      rules: apartmentRules
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Get rules for apartment
exports.getRules = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const apartmentRules = await Rules.findOne({
      apartmentName: new RegExp(currentUser.apartmentName, 'i')
    }).populate('landlord', 'name email');

    if (!apartmentRules) {
      return res.status(200).json({ 
        message: 'No rules found for this apartment',
        rules: []
      });
    }

    res.status(200).json(apartmentRules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Update rules (Landlord only)
exports.updateRules = async (req, res) => {
  const { ruleId } = req.params;
  const { title, description } = req.body;

  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser || currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can update rules' });
    }

    const apartmentRules = await Rules.findOne({
      apartmentName: new RegExp(currentUser.apartmentName, 'i'),
      landlord: currentUser._id
    });

    if (!apartmentRules) {
      return res.status(404).json({ message: 'Rules not found' });
    }

    const rule = apartmentRules.rules.id(ruleId);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    rule.title = title || rule.title;
    rule.description = description || rule.description;
    
    await apartmentRules.save();

    res.status(200).json({
      message: 'Rule updated successfully',
      rules: apartmentRules
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Delete rule (Landlord only)
exports.deleteRule = async (req, res) => {
  const { ruleId } = req.params;

  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser || currentUser.role !== 'Landlord') {
      return res.status(403).json({ message: 'Only landlords can delete rules' });
    }

    const apartmentRules = await Rules.findOne({
      apartmentName: new RegExp(currentUser.apartmentName, 'i'),
      landlord: currentUser._id
    });

    if (!apartmentRules) {
      return res.status(404).json({ message: 'Rules not found' });
    }

    apartmentRules.rules.id(ruleId).remove();
    await apartmentRules.save();

    res.status(200).json({
      message: 'Rule deleted successfully',
      rules: apartmentRules
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
