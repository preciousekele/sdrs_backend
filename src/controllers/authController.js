const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const prisma = new PrismaClient();

// Function to generate JWT token
const generateToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
};

// User Registration
exports.register = async (req, res) => {
    try {
        let { name, email, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields (name, email, password) are required" });
        }

        // Allowed roles
        const allowedRoles = ["user", "admin", "security"]; // Make sure "security" is here

        if (!allowedRoles.includes(role.toLowerCase().trim())) {
            return res.status(400).json({ error: "Invalid role. Allowed roles: 'user', 'admin', 'security'" });
        }        

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Normalize role (default to 'user' if not provided or invalid)
        role = role ? role.toLowerCase() : "user";
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ error: "Invalid role. Allowed roles: 'user' or 'admin'" });
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: { 
                name, 
                email, 
                password: hashedPassword,
                role 
            },
        });

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// User Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user in the database
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = generateToken(user);
        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
