const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const crypto = require('crypto');

dotenv.config();

const prisma = new PrismaClient();

// Generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Asynchronous function to send confirmation email
const sendConfirmationEmail = async (email, name, confirmUrl) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Confirm Your Email - SDARS",
      html: `
        <p>Hello ${name},</p>
        <p>Thanks for registering. Please confirm your email by clicking the link below:</p>
        <a href="${confirmUrl}">Confirm Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  } catch (err) {
    console.error("Email sending error:", err);
  }
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Email format validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email confirmation token
    const emailToken = crypto.randomBytes(32).toString('hex'); // Secure random token
    const emailTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 24 hours

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        emailToken,
        emailTokenExpiry,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate the confirmation URL
    const confirmUrl = `https://sdars-backend.onrender.com/confirm-email?token=${emailToken}`;

    // Send confirmation email asynchronously
    sendConfirmationEmail(email, name, confirmUrl);

    // Return response to the client
    res.status(201).json({
      success: true,
      message: "Registration successful. Check your email to confirm your account.",
      user: newUser,
    });

  } catch (error) {
    console.error("Registration Error:", error);
    // Handle Prisma unique constraint violation for email
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Email already exists" });
    }
    // Handle any other errors
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.confirmEmailGet = async (req, res) => {
  console.log("Email confirmation request received via GET");
  const { token } = req.query; // Get token from URL parameters

  try {
    // Check if the token exists and is valid
    const user = await prisma.user.findFirst({
      where: {
        emailToken: token,
        emailTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    // Token is invalid or expired
    if (!user) {
      const maybeUser = await prisma.user.findFirst({ where: { emailToken: token } });
      if (maybeUser && maybeUser.emailConfirmed) {
        return res.status(200).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
              <h2 style="color: green;">Email Already Confirmed!</h2>
              <p>Your email has already been confirmed. You can now log in.</p>
              <a href="https://mcu-sdars.vercel.app/#/login" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Login</a>
            </body>
          </html>
        `);
      }
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
            <h2 style="color: red;">Invalid or Expired Token</h2>
            <p>The confirmation link is invalid or has expired.</p>
            <a href="https://mcu-sdars.vercel.app/#/register" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Register Again</a>
          </body>
        </html>
      `);
    }

    // Update the user record to confirm the email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailConfirmed: true,
        emailToken: null,
        emailTokenExpiry: null,
      },
    });

    // Generate JWT token for authenticated user
    const jwtPayload = { id: user.id, email: user.email };
    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send success page with option to redirect
    res.status(200).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h2 style="color: green;">Email Confirmed Successfully!</h2>
          <p>Your email has been confirmed. You can now log in to your account.</p>
          <a href="https://mcu-sdars.vercel.app/#/login" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Login</a>
          <script>
            // Auto-redirect after 3 seconds
            setTimeout(() => {
              window.location.href = 'https://mcu-sdars.vercel.app/#/login?confirmed=true';
            }, 3000);
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("Email confirmation error:", err);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h2 style="color: red;">Confirmation Failed</h2>
          <p>Email confirmation failed. Please try again.</p>
          <a href="https://mcu-sdars.vercel.app/#?register" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Register Again</a>
        </body>
      </html>
    `);
  }
};

// Confirm Email
exports.confirmEmail = async (req, res) => {
  // Read the token from the body instead of query
  console.log("Email confirmation request received");
  const { token } = req.body;

  try {
    // Check if the token exists and is valid
    const user = await prisma.user.findFirst({
      where: {
        emailToken: token,
        emailTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    // Token is invalid or expired
    if (!user) {
      const maybeUser = await prisma.user.findFirst({ where: { emailToken: token } });
      if (maybeUser && maybeUser.emailConfirmed) {
        return res.status(200).json({ message: "Email already confirmed." });
      }
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Update the user record to confirm the email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailConfirmed: true,
        emailToken: null,
        emailTokenExpiry: null,
      },
    });

    // Generate JWT token for authenticated user
    const jwtPayload = { id: user.id, email: user.email };
    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: "Email confirmed! You can now log in.",
      token: accessToken,
    });

  } catch (err) {
    console.error("Email confirmation error:", err);
    res.status(500).json({ error: "Email confirmation failed" });
  }
};



// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.emailConfirmed) {
      return res.status(401).json({ error: "Please confirm your email before logging in." });
    }

    const token = generateToken(user);
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    res.status(200).json({
      message: "Login successful",
      user: userData,
      token,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

