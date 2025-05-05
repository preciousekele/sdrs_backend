
const express = require("express");
const { getUserStats, updateLastSeen, getAllUsers } = require("../controllers/userController");
const { restrictTo, verifyToken,  } = require("../middleware/authMiddleware");

const router = express.Router();


console.log("User routes loaded");
router.get("/stats", verifyToken, restrictTo("admin"), getUserStats);

router.get("/all-users", verifyToken, restrictTo("admin"), getAllUsers);

router.post("/heartbeat", verifyToken, updateLastSeen);

module.exports = router;
