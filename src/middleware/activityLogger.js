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

      console.log(`[Logger] Logging action: ${action}`);

      await prisma.UserActivity.create({
        data: {
          userId: req.user.id, // Must be set by verifyToken
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
