// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const express = require("express");   // Express framework for creating API
const cors = require("cors");         // Enables Cross-Origin Resource Sharing
const morgan = require("morgan");     // Logs HTTP requests
const helmet = require("helmet");     // Secures HTTP headers
const compression = require("compression"); // Compresses API responses for efficiency 

//registering routes
const authRoutes = require("./src/routes/authRoutes");
const recordRoutes = require("./src/routes/recordRoutes");
const protectedRoutes = require("./src/routes/protectedRoutes");
const userRoutes = require("./src/routes/userRoutes");
const { getUserActivities } = require("./src/controllers/userController");
// Initialize the Express application
const app = express();

// Middleware setup
app.use(express.json());  // Parses incoming JSON requests
app.use(cors());          // Enables CORS to allow frontend communication
app.use(morgan("dev"));   // Logs HTTP requests (e.g., GET, POST)
app.use(helmet());        // Adds security headers
app.use(compression());   // Compresses responses to save bandwidth

// Define a simple test route
app.get("/", (req, res) => {
    res.send("SDARS Backend is running");  // Sends a response to confirm the server is running
});

//registering routes
app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/protected", protectedRoutes); //protected routes
app.use("/api/users", userRoutes);
app.use('/api/activity', getUserActivities);
// Define the port (use environment variable or default to 5000)
const PORT = process.env.PORT || 5000;

// Start the server and listen for requests
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));