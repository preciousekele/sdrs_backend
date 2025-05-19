const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getUserStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: "admin" } });
    const normalUsers = await prisma.user.count({ where: { role: "user" } });

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
      normalUsers,
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
        createdAt: true,
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
  console.log("Last seen triggered by:", req.user); // DEBUG

  try {
    // Step 1: Update the lastSeenAt timestamp to the current time
    const user = await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
      select: { lastSeenAt: true, isActive: true }, // Retrieve lastSeenAt and isActive fields
    });

    // Step 2: Check if the user has been active within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    console.log("Five minutes ago:", fiveMinutesAgo);
    console.log("User lastSeenAt:", user.lastSeenAt);

    const isActive = new Date(user.lastSeenAt) > fiveMinutesAgo;
    console.log("Is user active?", isActive);

    // Step 3: Update the isActive field if necessary
    if (user.isActive !== isActive) {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: isActive },
      });
    }

    res.status(200).json({ message: "Last seen and activity status updated" });
  } catch (error) {
    console.error("Error updating last seen:", error);
    res.status(500).json({ message: "Failed to update last seen and activity status" });
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
      orderBy: { timestamp: "desc" },
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
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastSeenAt: true,
      },
    });

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
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

//get user profiile
const getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

//update Profile details
const updateProfile = async (req, res) => {
  const userId = req.user.id; 
  const { name, email } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

//to delete user profile
const deleteUserProfile = async (req, res) => {
  const userId = req.user.id; 

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: 'Your account has been deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

//to change user profile password
const bcrypt = require('bcryptjs');

const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  // Validate required fields
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Check if new passwords match
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: 'New password and confirm password do not match.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
};



module.exports = {
  getUserStats,
  updateLastSeen,
  getAllUsers,
  getUserActivities,
  deleteUser,
  updateUser,
  updateProfile,
  deleteUserProfile,
  changePassword,
  getProfile
};
