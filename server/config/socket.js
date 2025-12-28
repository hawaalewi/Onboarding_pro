import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL, // Client URL
            methods: ["GET", "POST"]
        }
    });

    // Redis Adapter Setup covering strictly horizontal scaling requirements
    const redisUrl = process.env.REDIS_URL;

    // Create Redis clients for Pub/Sub
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();

    // Error handling for Redis clients
    pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
    subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

    // Apply adapter
    io.adapter(createAdapter(pubClient, subClient));
    console.log(`Socket.IO configured with Redis Adapter at ${redisUrl}`);

    io.on('connection', (socket) => {
        // console.log('New client connected:', socket.id);

        // Join user to their own room based on query param
        const userId = socket.handshake.query.userId;
        if (userId) {
            socket.join(userId);
            // console.log(`User ${userId} joined room`);
        }

        socket.on('disconnect', () => {
            // console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
