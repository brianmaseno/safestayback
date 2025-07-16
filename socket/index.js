const Chat = require('../models/Chat');
const User = require('../models/User');

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected", socket.id);

    socket.on("joinRoom", async ({ username, roomId }) => {
      const user = await User.findOneAndUpdate(
        { name: username }, // use `name` instead of `username`
        { socketId: socket.id, isOnline: true },
        { new: true }
      );

      if (!user) return;

      socket.join(roomId);
      io.to(roomId).emit("userJoined", { user, roomId });

      // Typing
      socket.on("typing", () => {
        socket.to(roomId).emit("typing", username);
      });

      socket.on("stopTyping", () => {
        socket.to(roomId).emit("stopTyping", username);
      });

      // Send message
      socket.on("sendMessage", async ({ content, receiverName }) => {
        try {
          const receiver = await User.findOne({ name: receiverName });

          if (!receiver) return;

          const message = await Chat.create({
            senderName: user.name,
            receiverName: receiver.name,
            senderId: user._id,
            receiverId: receiver._id,
            senderRole: user.role,
            receiverRole: receiver.role,
            apartmentName: user.apartmentName,
            message: content
          });

          io.to(roomId).emit("newMessage", message); // or send to receiver.socketId if private
        } catch (error) {
          console.error("Message sending error:", error);
        }
      });

      // Disconnect
      socket.on("disconnect", async () => {
        const offlineUser = await User.findOneAndUpdate(
          { socketId: socket.id },
          { isOnline: false },
          { new: true }
        );

        if (offlineUser) {
          io.emit("userOffline", offlineUser.name);
        }
      });
    });
  });
};

module.exports = handleSocketConnection;
