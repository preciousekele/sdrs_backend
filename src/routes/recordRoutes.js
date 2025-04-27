const express = require("express");
const { verifyToken, restrictTo } = require("../middleware/authMiddleware");
const { PrismaClient } = require("@prisma/client");
const { createRecord } = require("../controllers/recordController");

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /api/records
 * @desc    Fetch all disciplinary records (Admins & Security can access)
 * @access  Admins & Security Personnel
 */
router.get(
  "/",
  verifyToken,
  restrictTo("admin", "security"),
  async (req, res) => {
    try {
      // 🛠 Add orderBy inside findMany
      const records = await prisma.record.findMany({
        orderBy: { id: "asc" },
      });

      if (!records.length) {
        return res.status(404).json({ message: "No records found" });
      }

      // Convert BigInt to string before sending response
      const serializedRecords = records.map((record) => ({
        ...record,
        matricNumber: record.matricNumber.toString(),
      }));

      res.status(200).json({
        message: "Records retrieved successfully",
        records: serializedRecords,
      });
    } catch (error) {
      console.error("Error fetching records:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @route   GET /api/records/stats
 * @desc    Get statistics for dashboard cards and charts
 * @access  Admins & Security Personnel
 */
router.get(
  "/stats",
  verifyToken,
  restrictTo("admin", "security"),
  async (req, res) => {
    try {
      const records = await prisma.record.findMany();

      // Convert BigInt to string for each record
      const serializedRecords = records.map((record) => ({
        ...record,
        matricNumber: record.matricNumber.toString(),
      }));

      const stats = {
        totalRecords: serializedRecords.length,
        offenses: {},
        pendingCount: 0,
        resolvedCount: 0,
        resolutionRate: 0,
      };

      for (const record of serializedRecords) {
        const offense = record.offense.toLowerCase().trim();
        const status = record.status.toLowerCase().trim();

        // Count offenses
        stats.offenses[offense] = (stats.offenses[offense] || 0) + 1;

        // Count statuses
        if (status === "pending") stats.pendingCount++;
        if (status === "resolved") stats.resolvedCount++;
      }

      // Calculate resolution rate
      if (stats.totalRecords > 0) {
        stats.resolutionRate = (
          (stats.resolvedCount / stats.totalRecords) *
          100
        ).toFixed(1); // in percentage
      }

      res.status(200).json({ message: "Dashboard stats retrieved", stats });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @route   GET /api/records/:id
 * @desc    Get a single disciplinary record
 * @access  Admins, Security, & Concerned Student
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid or missing record ID" });
    }

    const record = await prisma.record.findUnique({
      where: { id: parseInt(id) },
    });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "security" &&
      req.user.id !== record.matricNumber.toString() // Convert BigInt to string for comparison
    ) {
      return res
        .status(403)
        .json({ message: "Access forbidden: Not authorized" });
    }

    // Convert BigInt to string before sending response
    const serializedRecord = {
      ...record,
      matricNumber: record.matricNumber.toString(),
    };

    res.status(200).json({
      message: "Record retrieved successfully",
      record: serializedRecord,
    });
  } catch (error) {
    console.error("Error fetching record:", error);
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
    const existingRecord = await prisma.record.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingRecord) {
      return res.status(404).json({ error: "Record not found" });
    }

    const updatedRecord = await prisma.record.update({
      where: { id: parseInt(id) },
      data: { studentName, matricNumber, offense, punishment, status },
    });

    const serializedRecord = {
      ...updatedRecord,
      matricNumber: updatedRecord.matricNumber.toString(),
    };

    res.status(200).json({
      message: "Record updated successfully",
      record: serializedRecord,
    });
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
      where: { id: parseInt(id) },
    });

    if (!existingRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Delete the record
    await prisma.record.delete({
      where: { id: parseInt(id) },
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

    // Convert BigInt to string before sending response
    const serializedRecords = records.map((record) => ({
      ...record,
      matricNumber: record.matricNumber.toString(),
    }));

    res.status(200).json({
      message: "Database records retrieved",
      records: serializedRecords,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

router.post("/", verifyToken, restrictTo("admin"), createRecord);

module.exports = router;
