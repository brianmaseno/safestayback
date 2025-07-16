const Chat = require('../models/Chat');
const User = require('../models/User');

// ✅ Create Chat
exports.createChat = async (req, res) => {
  const { receiverNationalID, content } = req.body;

  try {
    const receiver = await User.findOne({ nationalID: receiverNationalID });
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const chat = await Chat.create({
      senderId: req.user._id,
      receiverId: receiver._id,
      senderName: req.user.name,
      receiverName: receiver.name,
      senderRole: req.user.role,
      receiverRole: receiver.role,
      content
    });

    // Populate the response
    const populatedChat = await Chat.findById(chat._id)
      .populate('senderId', 'name nationalID role')
      .populate('receiverId', 'name nationalID role');

    res.status(201).json({
      message: 'Chat created successfully',
      chat: populatedChat
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get My Chats (for current logged-in user)
exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
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

// ✅ Get All Chats (with user names)
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

// ✅ Get unique conversations for a user
exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all chats for this user
    const chats = await Chat.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
      .populate('senderId', 'name nationalID role')
      .populate('receiverId', 'name nationalID role')
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
