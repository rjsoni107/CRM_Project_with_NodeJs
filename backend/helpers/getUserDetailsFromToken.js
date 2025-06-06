const jwt = require('jsonwebtoken');
const User = require("../modules/userModelMongo");
/**
 * Verifies JWT token and fetches user details.
 * @param {string} token
 * @returns {Promise<Object|null>} User object or error info
 */
const getUserDetailsFromToken = async (token) => {
    if (!token) {
        return { error: true, message: 'Session expired. Please log in again.', logout: true };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return { error: true, message: 'User not found. Please log in again.', logout: true };
        }
        return user;
    } catch (error) {
        console.error('JWT verification error:', error.message);
        return { error: true, message: 'Invalid or expired token. Please log in again.', logout: true };
    }
};

module.exports = getUserDetailsFromToken;