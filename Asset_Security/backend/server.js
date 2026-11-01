/**
 * CampusAssetSecurity - Node.js / Express Server Entry Point
 * Smart Campus Asset Security System
 */
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO Setup for real-time dashboard events
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach IO instance to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusAssetSecurity Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// WebSocket Connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` CampusAssetSecurity API Server running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

module.exports = { app, server, io };
