require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const handleStream = require('./handlers/streamHandler'); // <--- IMPORT THIS

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
}));

app.get('/', (req, res) => {
    res.send('Mentor-JI Backend is Running! 🚀');
});

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Delegate audio logic to our new handler
    handleStream(io, socket); // <--- USE IT HERE

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`\n--- Mentor-JI Server ---`);
    console.log(`Listening on port: ${PORT}`);
});