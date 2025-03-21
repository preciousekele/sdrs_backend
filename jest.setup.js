const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Jest hook to run before all tests
beforeAll(async () => {
    console.log("📌 Setting up database for tests...");
    await prisma.$connect();
});

// Jest hook to clean up database between tests
beforeEach(async () => {
    console.log("🧹 Resetting database before each test...");
    await prisma.user.deleteMany();
    await prisma.record.deleteMany();
});

// Jest hook to close Prisma connection after all tests
afterAll(async () => {
    console.log("🛑 Closing database connection...");
    await prisma.$disconnect();
});
