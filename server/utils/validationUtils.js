/**
 * Validates email format using a safe, standard regex.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    // Standard HTML5 email regex pattern
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

/**
 * Validates password strength based on strict requirements.
 * Requirements:
 * - Minimum length (8+)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param {string} password
 * @returns {{ isValid: boolean, message: string|null }}
 */
export const validatePasswordStrength = (password) => {
    if (!password || typeof password !== 'string') {
        return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }

    // Special characters validation
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character' };
    }

    return { isValid: true, message: null };
};
