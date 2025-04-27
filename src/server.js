const dotenv = require("dotenv");
const { app, prisma } = require("./app");

dotenv.config();

const PORT = process.env.PORT || 5000;

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = server;