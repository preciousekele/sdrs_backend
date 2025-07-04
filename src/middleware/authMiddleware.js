const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Enhanced token verification
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Token received on server:", token);
    
    try {
        // 1. Check Authorization Header
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized - Missing token" });
        }

        // 2. Extract and Verify Token
        const token = authHeader.split(" ")[1].trim();
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - Malformed token" });
        }

        // 3. Verify JWT (with additional checks)
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"], // Explicit algorithm
            ignoreExpiration: false, // Force expiry check
        });

        // 4. Validate User in Database
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, name: true } 
        });

        if (!user) {
            return res.status(401).json({ message: "Unauthorized - User not found" });
        }

        // 5. Attach User to Request
        req.user = user;
        next();

    } catch (error) {
        // Enhanced error handling
        console.error(`Auth Error: ${error.name}`, error.message);

        const response = {
            "TokenExpiredError": { status: 401, message: "Token expired" },
            "JsonWebTokenError": { status: 401, message: "Invalid token" },
            "NotBeforeError": { status: 401, message: "Token not active" }
        }[error.name] || { status: 500, message: "Authentication failed" };

        return res.status(response.status).json({ message: response.message });
    }
};

// Role-based access control (optimized)
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user?.role) {
            return res.status(403).json({ message: "Access forbidden - User role missing" });
        }

        const normalizedRoles = roles.map(r => r.toLowerCase());
        if (!normalizedRoles.includes(req.user.role.toLowerCase())) {
            return res.status(403).json({ 
                message: `Forbidden - Requires roles: ${roles.join(", ")}`
            });
        }

        next();
    };
};

// Optional token refresh checker
const checkTokenRefresh = (req, res, next) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
        req.shouldRefresh = true; // Flag for frontend
    }
    next();
};

module.exports = { 
    verifyToken, 
    restrictTo,
    checkTokenRefresh 
};