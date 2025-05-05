// middleware/activityLogger.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function activityLogger(actionDescriptionOrFn) {
  return async (req, res, next) => {
    try {
      const action =
        typeof actionDescriptionOrFn === 'function'
          ? actionDescriptionOrFn(req)
          : actionDescriptionOrFn;

      const user = req.user; 

      await prisma.userActivity.create({
        data: {
          userId: user.id,
          userName: user.name,        
          action,
          timestamp: new Date(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || 'Unknown',
        },
      });
    } catch (error) {
      console.error('Activity log error:', error.message);
    }
    next();
  };
}

module.exports = activityLogger;
