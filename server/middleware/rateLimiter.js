import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Create a dedicated Redis client for rate limiting
// We use a separate client or reuse the connection string.
// Note: In high-scale apps, you might want to reuse a singleton client, 
// but for middleware simplicity, we instantiate here or export a shared client.
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (err) => {
    console.error('Redis Rate Limiter Error:', err);
});

/**
 * Distributed Rate Limiter Middleware
 * @param {number} limit - Max requests allowed
 * @param {number} windowSeconds - Time window in seconds
 */
export const rateLimiter = (limit = 100, windowSeconds = 60) => {
    return async (req, res, next) => {
        try {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const key = `rate:${ip}`;

            // Atomic increment
            const currentCount = await redis.incr(key);

            // Set expiry on first request
            if (currentCount === 1) {
                await redis.expire(key, windowSeconds);
            }

            // Check limit
            if (currentCount > limit) {
                return res.status(429).json({
                    error: "Too many requests. Please try again later."
                });
            }

            // Add X-RateLimit headers (optional but good practice)
            res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentCount));

            next();
        } catch (error) {
            console.error('Rate Limiter Error:', error);
            // Fail open: If Redis is down, allow the request to proceed
            // or fail closed depending on security requirements. 
            // We choose fail open to avoid downtime.
            next();
        }
    };
};
