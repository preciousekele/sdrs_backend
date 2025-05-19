const express = require("express");
const { verifyToken, restrictTo } = require("../middleware/authMiddleware");
const { PrismaClient } = require("@prisma/client");
const { createRecord, deleteRecord, getDeletedRecords, restoreRecord } = require("../controllers/recordController");
const activityLogger = require("../middleware/activityLogger");

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
  restrictTo("admin", "user"),
  activityLogger("Viewed all disciplinary records"),
  async (req, res) => {
    try {
      const records = await prisma.record.findMany({
        where: {
          isDeleted: false  // Only fetch records that haven't been deleted
        },
        orderBy: { id: "asc" },
      });

      // Return empty array instead of 404 if no records
      // This is better for frontend handling
      const serializedRecords = records.map((record) => ({
        ...record,
        matricNumber: record.matricNumber.toString(),
      }));

      res.status(200).json({
        message: records.length ? "Records retrieved successfully" : "No records found",
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
  restrictTo("admin", "user"),
  async (req, res) => {
    try {
      // Only fetch non-deleted records for stats calculation
      const records = await prisma.record.findMany({
        where: {
          isDeleted: false  // Only include active (non-deleted) records
        }
      });

      // Convert BigInt to string for each record
      const serializedRecords = records.map((record) => ({
        ...record,
        matricNumber: record.matricNumber.toString(),
        createdAt: record.createdAt, // Ensure createdAt is included
      }));

      const stats = {
        totalRecords: serializedRecords.length,
        offenses: {},
        pendingCount: 0,
        resolvedCount: 0,
        resolutionRate: 0,
      };

      // Group records by month
      const recordsByMonth = {};
      
      for (const record of serializedRecords) {
        const offense = record.offense.toLowerCase().trim();
        const status = record.status.toLowerCase().trim();
        const month = new Date(record.createdAt).toISOString().substring(0, 7); // Format: YYYY-MM
        
        // Initialize month data if not exists
        if (!recordsByMonth[month]) {
          recordsByMonth[month] = {
            total: 0,
            resolved: 0
          };
        }
        
        // Count offenses
        stats.offenses[offense] = (stats.offenses[offense] || 0) + 1;
        
        // Count statuses
        if (status === "pending") stats.pendingCount++;
        if (status === "resolved") stats.resolvedCount++;
        
        // Add to monthly stats
        recordsByMonth[month].total++;
        if (status === "resolved") {
          recordsByMonth[month].resolved++;
        }
      }
      
      // Calculate resolution rate based on: (current month - previous month) / current month * 100
      const months = Object.keys(recordsByMonth).sort();
      if (months.length >= 2) {
        const currentMonth = months[months.length - 1];
        const previousMonth = months[months.length - 2];
        
        const currentMonthTotal = recordsByMonth[currentMonth].total;  // 9 cases for example
        const previousMonthTotal = recordsByMonth[previousMonth].total;  // 3 cases for example
        
        if (currentMonthTotal > 0) {
          // Example: ((9-3)/9)*100 = 66.7%
          stats.resolutionRate = (((currentMonthTotal - previousMonthTotal) / currentMonthTotal) * 100).toFixed(1);
        } else {
          // If current month has 0 cases
          stats.resolutionRate = "0.0";
        }
      } else {
        // Not enough data for month-over-month comparison
        stats.resolutionRate = "0.0";
      }

      res.status(200).json({ 
        message: "Dashboard stats retrieved", 
        stats,
        // Include monthly breakdown for reference
        monthlyData: Object.entries(recordsByMonth).map(([month, data]) => ({
          month,
          totalCases: data.total,
          resolvedCases: data.resolved
        }))
      });
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
router.get(
  "/:id",
  verifyToken,
  activityLogger((req) => `Viewed record ID ${req.params.id}`),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res
          .status(400)
          .json({ message: "Invalid or missing record ID" });
      }

      const record = await prisma.record.findUnique({
        where: { id: parseInt(id) },
      });

      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }

      if (
        req.user.role !== "admin" &&
        req.user.role !== "user" &&
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
  }
);

/**
 * @route   PUT /api/records/:id
 * @desc    Update an existing disciplinary record
 * @access  Admins only
 */
router.put(
  "/:id",
  verifyToken,
  restrictTo("admin"),
  activityLogger((req) => `Updated record ID ${req.params.id}`),
  //more detailed
  //activityLogger((req) => `Updated record ID ${req.params.id} - Fields: ${Object.keys(req.body).join(", ")}`)

  async (req, res) => {
    try {
      const { id } = req.params;
      const { studentName, matricNumber, offense, department, punishment, status } =
        req.body;

      // Check if record exists
      const existingRecord = await prisma.record.findUnique({
        where: { id: parseInt(id) },
      });
      if (!existingRecord) {
        return res.status(404).json({ error: "Record not found" });
      }

      const updatedRecord = await prisma.record.update({
        where: { id: parseInt(id) },
        data: { studentName, matricNumber, offense, department, punishment, status },
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
  }
);

/**
 * @route   DELETE /api/records/:id
 * @desc    Delete a disciplinary record
 * @access  Admins only
 */
router.delete(
  "/:id",
  verifyToken,
  restrictTo("admin"),
  activityLogger((req) => `Deleted record ID ${req.params.id}`),
  deleteRecord);

router.get('/deleted/all', getDeletedRecords);

router.patch('/restore/:id', restoreRecord);

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

router.post(
  "/",
  verifyToken,
  restrictTo("admin"),
  activityLogger("Added a new disciplinary record"),
  createRecord
);

//protected route for fetching records

module.exports = router;