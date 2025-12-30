import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { createServer } from 'http';
import { initSocket } from './config/socket.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// Database
connectDB();

// Rate Limiter
import { rateLimiter } from './middleware/rateLimiter.js';

// Base rate limit: 100 requests per minute per IP
app.use('/api', rateLimiter(100, 60));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    port: process.env.PORT || 5000,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => res.status(200).json({ message: 'API running smoothly!' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Server setup
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
