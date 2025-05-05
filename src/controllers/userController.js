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
  

module.exports = { getUserStats, updateLastSeen, getAllUsers };