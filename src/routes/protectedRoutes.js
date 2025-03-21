const express = require("express");
const { verifyToken, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// Everyone with a valid token can view records
router.get("/", verifyToken, (req, res) => {
    res.json({ message: "List of records - Only authenticated users can access" });
});

// Only admins can create records
router.post("/", verifyToken, restrictTo("admin"), (req, res) => {
    res.json({ message: "Disciplinary record created - Only admins can do this" });
});

// Only admins can delete records
router.delete("/:id", verifyToken, restrictTo("admin"), (req, res) => {
    res.json({ message: "Record deleted - Only admins can delete records" });
});

module.exports = router;
