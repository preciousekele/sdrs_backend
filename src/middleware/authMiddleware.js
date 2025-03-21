const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        const token = authHeader.split(" ")[1];

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from the database to ensure they still exist
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) {
            return res.status(401).json({ message: "Unauthorized - User no longer exists" });
        }

        req.user = user; // Attach user data to request object
        next(); // Proceed to next middleware or route handler

    } catch (error) {
        console.error("JWT Error:", error.message);

        // Differentiate between expired and invalid token
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Unauthorized - Token expired" });
        } else {
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }
    }
};

// ✅ Improved Middleware to restrict access based on roles
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: "Access forbidden - No role assigned" });
        }

        // Convert user role & allowed roles to lowercase for case-insensitive comparison
        const userRole = req.user.role.toLowerCase();
        const normalizedRoles = allowedRoles.map(role => role.toLowerCase());

        if (!normalizedRoles.includes(userRole)) {
            return res.status(403).json({ message: "Access forbidden - You don’t have permission" });
        }

        next(); // Proceed if role is authorized
    };
};


// Export the middleware functions
module.exports = { verifyToken, restrictTo };
