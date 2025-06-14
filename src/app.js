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

// === Middleware ===
app.use(cors({
  origin: [
    "https://mcu-sdars.vercel.app",
    "https://mcu-sdars-admin.vercel.app",
    "https://mcu-sdars-user.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"]
}));

app.use(express.json());

// === Routes ===
app.use("/api/auth", authRoutes);
//record
app.use('/api/records', recordRoutes)

app.use("/api/users", userRoutes);
// === Default route ===
app.get("/", (req, res) => {
  res.send("Welcome to the SDARS API 🎓");
});


module.exports = { app, prisma };
