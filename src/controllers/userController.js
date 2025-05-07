const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUserStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: 'admin' } });
    const regularUsers = await prisma.user.count({ where: { role: 'user' } });
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeUsers = await prisma.user.count({
      where: {
        lastSeenAt: {
          gte: fiveMinutesAgo,
        },
      },
    });    

    res.status(200).json({
      totalUsers,
      adminUsers,
      regularUsers,
      activeUsers,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastSeenAt: true, 
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};


const updateLastSeen = async (req, res) => {
    const userId = req.user.id;
  
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      });
  
      res.status(200).json({ message: "Last seen updated" });
    } catch (error) {
      console.error("Error updating last seen:", error);
      res.status(500).json({ message: "Failed to update last seen" });
    }
  };
  
  const getUserActivities = async (req, res) => {
    const { id } = req.params;
    const { from, to } = req.query;
  
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
  
    try {
      const filters = {
        userId: parseInt(id),
      };
  
      // Optional date filtering
      if (from || to) {
        filters.timestamp = {};
        if (from) filters.timestamp.gte = new Date(from);
        if (to) filters.timestamp.lte = new Date(to);
      }
  
      const activities = await prisma.userActivity.findMany({
        where: filters,
        orderBy: { timestamp: 'desc' },
      });
  
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  };
  /**
 * @desc    Update a user's information
 * @route   PUT /api/users/:id
 * @access  Admin
 */
const updateUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email, role, isActive } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastSeenAt: true
      }
    });

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

  

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
const deleteUser = async (req, res) => {
  const userId = parseInt(req.params.id, 10); // Ensure base 10 parsing for integer

  // Check if the ID is valid
  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    // Check if user exists before deleting
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Proceed with deletion
    await prisma.user.delete({ where: { id: userId } });

    // Send success response
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error.message);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};


module.exports = { getUserStats, updateLastSeen, getAllUsers, getUserActivities, deleteUser, updateUser };