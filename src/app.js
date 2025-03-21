const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Import Routes
const authRoutes = require("./routes/authRoutes");  // Ensure these routes exist
app.use("/api/auth", authRoutes);

// Default route
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to SDARS API" });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

module.exports = app; // ✅ Export only the app (NOT the server)
