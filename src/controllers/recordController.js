import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createRecord = async (req, res) => {
  try {
    const { studentName, matricNumber, offense, punishment, date, status } = req.body;

    if (!studentName || !matricNumber || !offense || !punishment || !date || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newRecord = await prisma.record.create({
      data: {
        studentName,
        matricNumber: BigInt(matricNumber), // Use BigInt for storage
        offense,
        punishment,
        status,
        createdAt: new Date(date),
      },
    });

    // Convert BigInt to string before sending in the response
    newRecord.matricNumber = newRecord.matricNumber.toString();

    return res.status(201).json({ message: "Record created", record: newRecord });

  } catch (err) {
    console.error("Error creating record:", err.message);
    return res.status(500).json({ message: "Server error: Failed to create record" });
  }
};
