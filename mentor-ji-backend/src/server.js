require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// 1. App Setup
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// 2. Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "*", // Allow connection from your frontend
    methods: ["GET", "POST"]
}));
app.use(express.json());

// 3. Basic Route (Health Check)
app.get('/', (req, res) => {
    res.send('Mentor-JI Backend is Running! 🚀');
});

// 4. WebSocket Setup
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    }
});

// 5. WebSocket Event Handlers
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Listen for a student joining a session
    socket.on('join_session', (data) => {
        const { sessionId, studentId } = data;
        console.log(`Student ${studentId} joined session ${sessionId}`);
        socket.join(sessionId);
        
        // Acknowledge the connection
        socket.emit('session_joined', { 
            status: 'success', 
            message: 'Connected to Mentor-JI Classroom' 
        });
    });

    // Handle Disconnection
    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

// 6. Start Server
server.listen(PORT, () => {
    console.log(`\n--- Mentor-JI Server ---`);
    console.log(`Listening on port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});