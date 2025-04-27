const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const authRoutes = require("./routes/authRoutes");
const recordRoutes = require('./routes/recordRoutes');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// === Middleware ===
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// === Routes ===
app.use("/api/auth", authRoutes);
//record
app.use('/api/records', recordRoutes)
// === Default route ===
app.get("/", (req, res) => {
  res.send("Welcome to the SDARS API 🎓");
});


module.exports = { app, prisma };
