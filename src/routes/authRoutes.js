const express = require("express");
const { register, login } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const authController = require('../controllers/authController');

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get('/confirm-email', authController.confirmEmailGet);
router.post('/confirm-email', authController.confirmEmail);
router.get("/profile", verifyToken, (req, res) => {
    res.json({ message: "User profile", user: req.user }); //protected route
});

module.exports = router;

