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

export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if record exists
    const existingRecord = await prisma.record.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecord) {
      return res.status(404).json({ message: "Record not found." });
    }

    // Delete the record
    await prisma.record.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({ message: "Record deleted successfully." });

  } catch (err) {
    console.error("Error deleting record:", err.message);
    return res.status(500).json({ message: "Server error: Failed to delete record" });
  }
};
