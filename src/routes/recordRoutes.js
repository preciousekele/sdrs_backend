const express = require("express");
const { verifyToken, restrictTo } = require("../middleware/authMiddleware");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /api/records
 * @desc    Fetch all disciplinary records (Admins & Security can access)
 * @access  Admins & Security Personnel
 */
router.get("/", verifyToken, restrictTo("admin", "security"), async (req, res) => {
    try {
        const records = await prisma.record.findMany();
        if (!records.length) {
            return res.status(404).json({ message: "No records found" });
        }
        res.status(200).json({ message: "Records retrieved successfully", records });
    } catch (error) {
        console.error("Error fetching records:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @route   GET /api/records/:id
 * @desc    Get a single disciplinary record
 * @access  Admins, Security, & Concerned Student
 */
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const record = await prisma.record.findUnique({ where: { id: parseInt(id) } });

        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }

        // Allow only admins, security, or the student involved to view
        if (req.user.role !== "admin" && req.user.role !== "security" && req.user.id !== record.matricNumber) {
            return res.status(403).json({ message: "Access forbidden: Not authorized" });
        }

        res.status(200).json({ message: "Record retrieved successfully", record });
    } catch (error) {
        console.error("Error fetching record:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @route   POST /api/records
 * @desc    Create a new disciplinary record
 * @access  Admins only
 */
router.post("/", verifyToken, restrictTo("admin"), async (req, res) => {
    try {
        let { studentName, matricNumber, offense, punishment, status } = req.body;

        // Validate matricNumber
        matricNumber = parseInt(matricNumber, 10); // Convert to an integer
        if (isNaN(matricNumber)) return res.status(400).json({ message: "Invalid student ID" });

        // Default value for status if missing
        status = status ? status.trim() : "Active"; // Default to "Active" if no status is provided

        // Create record in the database
        const newRecord = await prisma.record.create({
            data: { studentName, matricNumber, offense, punishment, status },
        });

        res.status(201).json({ message: "Disciplinary record created", record: newRecord });
    } catch (error) {
        console.error("Error creating record:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @route   PUT /api/records/:id
 * @desc    Update an existing disciplinary record
 * @access  Admins only
 */
router.put("/:id", verifyToken, restrictTo("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const { studentName, matricNumber, offense, punishment, status } = req.body;

        // Check if record exists
        const existingRecord = await prisma.record.findUnique({ where: { id: parseInt(id) } });
        if (!existingRecord) {
            return res.status(404).json({ error: "Record not found" });
        }

        const updatedRecord = await prisma.record.update({
            where: { id: parseInt(id) },
            data: { studentName, matricNumber, offense, punishment, status },
        });

        res.status(200).json({ message: "Record updated successfully", record: updatedRecord });
    } catch (error) {
        console.error("Error updating record:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @route   DELETE /api/records/:id
 * @desc    Delete a disciplinary record
 * @access  Admins only
 */
router.delete("/:id", verifyToken, restrictTo("admin"), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the record exists
        const existingRecord = await prisma.record.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingRecord) {
            return res.status(404).json({ message: "Record not found" });
        }

        // Delete the record
        await prisma.record.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: "Record deleted successfully" });
    } catch (error) {
        console.error("Error deleting record:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Query Postgres directly from Prisma
router.get("/test-db", async (req, res) => {
    try {
        const records = await prisma.record.findMany();
        res.status(200).json({ message: "Database records retrieved", records });
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
