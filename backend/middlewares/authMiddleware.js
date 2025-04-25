const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]; // Get the Authorization header

    if (!authHeader) {
        return res.status(403).json({
            responseStatus: "FAILED",
            responseMsg: "No token provided",
            responseCode: "403",
        });
    }

    // Extract the token from the "Bearer <token>" format
    const token = authHeader.split(" ")[1]; // Split the header and get the token part

    if (!token) {
        return res.status(403).json({
            responseStatus: "FAILED",
            responseMsg: "No token provided",
            responseCode: "403",
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user info to the request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        res.status(401).json({
            responseStatus: "FAILED",
            responseMsg: "Invalid or expired token",
            responseCode: "401",
        });
    }
};