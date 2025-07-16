const Chat = require('../models/Chat');
const User = require('../models/User');

// ✅ Create a new chat message
exports.createChat = async (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user._id;

  console.log('💬 Chat request body:', req.body);
  console.log('💬 Message content:', message);
  console.log('💬 Receiver ID:', receiverId);

  try {
    // Find sender and receiver
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    console.log('💬 Chat attempt - Sender:', sender ? sender.name : 'NOT FOUND');
    console.log('💬 Chat attempt - Receiver:', receiver ? receiver.name : 'NOT FOUND');
    console.log('💬 Chat attempt - Sender apartmentName:', sender ? sender.apartmentName : 'N/A');
    console.log('💬 Chat attempt - Receiver apartmentName:', receiver ? receiver.apartmentName : 'N/A');

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'Sender or receiver not found' });
    }

    // Check if both users have apartment names
    if (!sender.apartmentName || !receiver.apartmentName) {
      console.log('❌ Missing apartment name - Sender:', sender.apartmentName, 'Receiver:', receiver.apartmentName);
      return res.status(400).json({ message: 'Both users must have apartment names set' });
    }

    // Check if they are in the same apartment (case-insensitive)
    if (sender.apartmentName.toLowerCase() !== receiver.apartmentName.toLowerCase()) {
      return res.status(403).json({ message: 'Can only chat with people in the same apartment' });
    }

    // Check for duplicate messages (same content from same sender to same receiver within 5 seconds)
    const recentMessage = await Chat.findOne({
      senderId,
      receiverId,
      message: message.trim(),
      createdAt: { $gte: new Date(Date.now() - 5000) } // Within last 5 seconds
    });

    if (recentMessage) {
      console.log('🔄 Duplicate message detected, returning existing message');
      const populatedMessage = await Chat.findById(recentMessage._id)
        .populate('senderId', 'name nationalID role apartmentName')
        .populate('receiverId', 'name nationalID role apartmentName');
      
      return res.status(200).json({
        success: true,
        chat: populatedMessage,
        message: 'Message already exists'
      });
    }

    // Create the chat
    const newChat = new Chat({
      senderId,
      receiverId,
      senderName: sender.name,
      receiverName: receiver.name,
      senderRole: sender.role,
      receiverRole: receiver.role,
      apartmentName: sender.apartmentName,
      message: message.trim(),
      timestamp: new Date()
    });

    const savedChat = await newChat.save();
    
    // Populate the saved chat before returning
    const populatedChat = await Chat.findById(savedChat._id)
      .populate('senderId', 'name nationalID role apartmentName')
      .populate('receiverId', 'name nationalID role apartmentName');

    console.log('💬 New chat created:', populatedChat);
    res.status(201).json({
      success: true,
      chat: populatedChat,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('❌ Error creating chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get My Chats (for the logged-in user - apartment-based)
exports.getMyChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser.apartmentName) {
      return res.status(400).json({ message: 'User must have apartment name set' });
    }

    // Get chats only from the same apartment (case-insensitive)
    const chats = await Chat.find({
      $and: [
        {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        {
          apartmentName: new RegExp(currentUser.apartmentName, 'i')
        }
      ]
    })
      .populate('senderId', 'name nationalID role apartmentName')
      .populate('receiverId', 'name nationalID role apartmentName')
      .sort({ createdAt: 1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error('❌ Error getting chats:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All Chats (for admin purposes)
exports.getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('senderId', 'name nationalID role')
      .populate('receiverId', 'name nationalID role')
      .sort({ createdAt: 1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Chats by NationalID (for one user's chat history)
exports.getChatsByNationalID = async (req, res) => {
  const { nationalID } = req.params;

  try {
    const user = await User.findOne({ nationalID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const chats = await Chat.find({
      $or: [
        { senderId: user._id },
        { receiverId: user._id }
      ]
    })
      .populate('senderId', 'name nationalID role')
      .populate('receiverId', 'name nationalID role')
      .sort({ createdAt: 1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get conversation between two users
exports.getConversation = async (req, res) => {
  const { userId1, userId2 } = req.params;

  try {
    const chats = await Chat.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    })
      .populate('senderId', 'name nationalID role')
      .populate('receiverId', 'name nationalID role')
      .sort({ createdAt: 1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get unique conversations for a user (apartment-based)
exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser.apartmentName) {
      return res.status(400).json({ message: 'User must have apartment name set' });
    }

    // Get all chats for this user in the same apartment
    const chats = await Chat.find({
      $and: [
        {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        {
          apartmentName: new RegExp(currentUser.apartmentName, 'i')
        }
      ]
    })
      .populate('senderId', 'name nationalID role apartmentName')
      .populate('receiverId', 'name nationalID role apartmentName')
      .sort({ createdAt: -1 });

    // Group chats by conversation partner
    const conversationMap = new Map();
    
    chats.forEach(chat => {
      const isCurrentUserSender = chat.senderId._id.toString() === userId.toString();
      const partnerId = isCurrentUserSender ? chat.receiverId._id.toString() : chat.senderId._id.toString();
      const partnerName = isCurrentUserSender ? chat.receiverName : chat.senderName;
      const partnerRole = isCurrentUserSender ? chat.receiverRole : chat.senderRole;
      const partnerNationalID = isCurrentUserSender ? chat.receiverId.nationalID : chat.senderId.nationalID;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partnerName,
          partnerRole,
          partnerNationalID,
          lastMessage: chat,
          messageCount: 0
        });
      }
      
      conversationMap.get(partnerId).messageCount++;
      
      // Update last message if this one is newer
      if (new Date(chat.createdAt) > new Date(conversationMap.get(partnerId).lastMessage.createdAt)) {
        conversationMap.get(partnerId).lastMessage = chat;
      }
    });

    // Convert to array and sort by last message date
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get available chat partners (tenants for landlord, landlord for tenant)
exports.getAvailableChatPartners = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let partners = [];

    if (currentUser.role === 'Landlord') {
      // Landlord can see all tenants in their apartment
      partners = await User.find({
        apartmentName: new RegExp(currentUser.apartmentName, 'i'),
        role: 'Tenant',
        _id: { $ne: userId }
      }).select('name nationalID role apartmentName');
    } else {
      // Tenant can only see their landlord
      partners = await User.find({
        apartmentName: new RegExp(currentUser.apartmentName, 'i'),
        role: 'Landlord',
        _id: { $ne: userId }
      }).select('name nationalID role apartmentName');
    }

    res.status(200).json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
