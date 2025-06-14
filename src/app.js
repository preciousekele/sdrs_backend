const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const authRoutes = require("./routes/authRoutes");
const recordRoutes = require('./routes/recordRoutes');
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// === Enhanced CORS Configuration ===
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://mcu-sdars.vercel.app",
      "https://mcu-sdars-admin.vercel.app", 
      "https://mcu-sdars-user.vercel.app"
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "Pragma"
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());

// === Routes ===
app.use("/api/auth", authRoutes);
app.use('/api/records', recordRoutes);
app.use("/api/users", userRoutes);

// === Default route ===
app.get("/", (req, res) => {
  res.send("Welcome to the SDARS API 🎓");
});

module.exports = { app, prisma };
