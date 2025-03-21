const request = require("supertest");
const app = require("../src/app"); // Ensure this points to your Express app
const prisma = require("../src/config/prismaClient");

describe("Authentication Tests", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany(); // Reset database before each test
  });

  test("Should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "admin"
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty("id");
  });

  it("Should login with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
    });

    console.log("Login Response:", res.body); // ✅ Log response for debugging
  });
});
