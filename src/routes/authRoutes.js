const express = require("express");
const { register, login } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, (req, res) => {
    res.json({ message: "User profile", user: req.user }); // Example of protected route
});

module.exports = router;

