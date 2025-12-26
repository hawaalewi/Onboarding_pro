import mongoose from 'mongoose';

/**
 * Middleware to validate one or more ObjectId route parameters.
 * @param {string[]} params - Array of parameter names to validate (e.g., ['id', 'sessionId'])
 */
export const validateObjectId = (params = ['id']) => {
    return (req, res, next) => {
        for (const param of params) {
            if (req.params[param] && !mongoose.Types.ObjectId.isValid(req.params[param])) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ID format for parameter: ${param}`
                });
            }
        }
        next();
    };
};
