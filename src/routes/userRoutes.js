
const express = require("express");
const { getUserStats, updateLastSeen, getAllUsers, getUserActivities, updateUser, deleteUser, updateProfile, deleteUserProfile, changePassword, getProfile } = require("../controllers/userController");
const { restrictTo, verifyToken,  } = require("../middleware/authMiddleware");
const { PrismaClient } = require('@prisma/client');

const router = express.Router();

const prisma = new PrismaClient();
console.log("User routes loaded");
router.get("/stats", verifyToken, restrictTo("admin"), getUserStats);

router.get("/all-users", verifyToken, restrictTo("admin"), getAllUsers);

router.get('/user/:id', verifyToken, getUserActivities);

// PUT /api/users/:id - Update user (admin only)
router.put("/edit-user/:id", verifyToken, restrictTo("admin"), updateUser);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/delete-user/:id', verifyToken, restrictTo("admin"), deleteUser);

router.get('/user/:userId/activity', async (req, res) => {
    const userId = parseInt(req.params.userId);
  
    try {
      // Fetch user activities from the database using Prisma
      const activities = await prisma.userActivity.findMany({
        where: {
          userId: userId,
        },
        select: {
          action: true,
          timestamp: true,
          ipAddress: true,
          userAgent: true,
        },
        orderBy: {
          timestamp: 'desc', 
        },
      });
  
      // Return the activities to the frontend
      res.json(activities);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch user activities' });
    }
  });
router.get('/profile/', verifyToken, getProfile);

router.put('/profile/update', verifyToken, updateProfile);

router.delete('/profile/delete', verifyToken, deleteUserProfile);

router.put('/profile/change-password', verifyToken, changePassword);

router.post("/heartbeat", verifyToken, updateLastSeen);



module.exports = router;
