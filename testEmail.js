const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: process.env.EMAIL_FROM,
  to: 'recipient@example.com', // Replace with the recipient email
  subject: 'Test Email',
  text: 'This is a test email.',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Failed to send email:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
