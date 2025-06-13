import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createRecord = async (req, res) => {
  try {
    const { studentName, matricNumber, level, offense, punishment, date, status, department } = req.body;

    if (
      !studentName ||
      !matricNumber ||
      !level ||
      !offense ||
      !punishment ||
      !date ||
      !department ||
      !status
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newRecord = await prisma.record.create({
      data: {
        studentName,
        matricNumber: BigInt(matricNumber), // Use BigInt for storage
        level,
        offense,
        punishment,
        status,
        department,
        createdAt: new Date(date),
      },
    });

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

    const existingRecord = await prisma.record.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRecord) {
      return res.status(404).json({ message: "Record not found." });
    }

    if (existingRecord.isDeleted) {
      return res.status(400).json({ message: "Record is already deleted." });
    }

    const updatedRecord = await prisma.record.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    updatedRecord.matricNumber = updatedRecord.matricNumber.toString();

    return res
      .status(200)
      .json({ message: "Record soft deleted.", record: updatedRecord });
  } catch (err) {
    console.error("Error soft deleting record:", err.message);
    return res
      .status(500)
      .json({ message: "Server error: Failed to delete record" });
  }
};

export const getDeletedRecords = async (req, res) => {
  try {
    const deletedRecords = await prisma.record.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
    });

    // Convert BigInt to string
    const formatted = deletedRecords.map((record) => ({
      ...record,
      matricNumber: record.matricNumber.toString(),
    }));

    return res.status(200).json({ deletedRecords: formatted });
  } catch (err) {
    console.error("Error fetching deleted records:", err.message);
    return res
      .status(500)
      .json({ message: "Server error: Failed to fetch deleted records" });
  }
};

export const restoreRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const recordId = parseInt(id);

    // Validate ID
    if (isNaN(recordId)) {
      return res.status(400).json({ message: "Invalid record ID." });
    }

    // Check if record exists
    const existingRecord = await prisma.record.findUnique({
      where: { id: recordId },
    });

    if (!existingRecord) {
      return res.status(404).json({ message: "Record not found." });
    }

    // Check if already active
    if (!existingRecord.isDeleted) {
      return res.status(400).json({ message: "Record is not deleted." });
    }

    // Restore the record
    const restoredRecord = await prisma.record.update({
      where: { id: recordId },
      data: {
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      },
    });

    // Convert BigInt for response
    restoredRecord.matricNumber = restoredRecord.matricNumber.toString();

    return res.status(200).json({
      message: "Record restored successfully.",
      record: restoredRecord,
    });
  } catch (err) {
    console.error("Error restoring record:", err.message);
    return res.status(500).json({
      message: "Server error: Failed to restore record",
    });
  }
};