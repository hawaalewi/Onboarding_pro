// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; // Make sure you have db.js as shown before
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

import activityLogRoutes from './routes/activityLogRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

// Database connection
connectDB()


import notificationRoutes from './routes/notificationRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/export', exportRoutes);


// Health check / root route
app.get('/', (req, res) => {
  res.status(200).json({ message: ' Connect Onboard API is running smoothly!' });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (optional but professional)
app.use((err, req, res, next) => {
  console.error(` Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server' });
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server  on port ${PORT}`));
