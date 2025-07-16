const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');  // <-- NEW
const { Server } = require('socket.io');  // <-- NEW
const connectDB = require('./config/db');
const cors = require('cors');  // <-- Optional but recommended

dotenv.config();

// Debug: Check if JWT_SECRET is loaded
console.log('🔑 JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('🔑 JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('🔑 JWT_SECRET preview:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 20) + '...' : 'NONE');

// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json());
app.use(cors());  // Allow frontend to connect (adjust origin in production)

// Import Routes
const billRoutes = require('./routes/billsRoute');
const complaintRoutes = require('./routes/complaintRoute');
const chatRoutes = require('./routes/chatRoutes'); 
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const rulesRoutes = require('./routes/rulesRoute');
const apartmentRoutes = require('./routes/apartmentRoutes');

app.use('/api/bills', billRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/apartments', apartmentRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Home Management Backend Running');
});

// Create HTTP Server & Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',  // For development — tighten for production
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Import Socket Handler
const chatSocket = require('./socket/index');
chatSocket(io);  // Call the socket logic

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
