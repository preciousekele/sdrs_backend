const express = require("express");
const { register, login } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const authController = require('../controllers/authController');
const router = express.Router();

// Handle OPTIONS requests for all auth routes
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

router.post("/register", register);
router.post("/login", login);
router.post('/confirm-email', authController.confirmEmail);

router.get("/profile", verifyToken, (req, res) => {
    res.json({ message: "User profile", user: req.user }); //protected route
});

module.exports = router;
