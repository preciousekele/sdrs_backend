import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createRecord = async (req, res) => {
  try {
    const {
      studentName,
      matricNumber,
      level,
      offense,
      punishment,
      date,
      status,
      department,
      punishmentDuration,
      resumptionPeriod,
    } = req.body;

    // Validate required fields
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

    const normalizedMatricNumber = BigInt(matricNumber);
    
    // Count previous records for same matricNumber (non-deleted)
    const existingOffenses = await prisma.record.count({
      where: {
        matricNumber: normalizedMatricNumber,
        isDeleted: false,
      },
    });

    // The new record will be the (existingOffenses + 1)th offense for this student
    const newOffenseCount = existingOffenses + 1;

    // Create new record
    const newRecord = await prisma.record.create({
      data: {
        studentName,
        matricNumber: normalizedMatricNumber,
        level,
        offense,
        punishment,
        status,
        department,
        date: new Date(date), // Use 'date' field instead of 'createdAt'
        offenseCount: newOffenseCount, // This should be the new count, not existing
        punishmentDuration:
          punishmentDuration && 
          punishmentDuration.trim() !== "" && 
          punishmentDuration.trim().toLowerCase() !== "nil"
            ? punishmentDuration.trim()
            : "Nil",
        resumptionPeriod:
          resumptionPeriod && 
          resumptionPeriod.trim() !== "" && 
          resumptionPeriod.trim().toLowerCase() !== "nil"
            ? resumptionPeriod.trim()
            : "Nil",
      },
    });

    // Convert BigInt for response
    newRecord.matricNumber = newRecord.matricNumber.toString();

    return res.status(201).json({
      message: "Record created",
      record: newRecord,
    });
  } catch (err) {
    console.error("Error creating record:", err.message);
    return res
      .status(500)
      .json({ message: "Server error: Failed to create record" });
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

    // Soft delete the record
    const updatedRecord = await prisma.record.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // After soft deletion, update offense counts for remaining records of the same student
    await updateOffenseCountsForStudent(updatedRecord.matricNumber);

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
      date: record.date?.toISOString().split('T')[0], // Format date for display
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

    // After restoration, update offense counts for all records of the same student
    await updateOffenseCountsForStudent(restoredRecord.matricNumber);

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

// Helper function to update offense counts for a student
const updateOffenseCountsForStudent = async (matricNumber) => {
  try {
    // Get all non-deleted records for this student, ordered by date
    const studentRecords = await prisma.record.findMany({
      where: {
        matricNumber: matricNumber,
        isDeleted: false,
      },
      orderBy: { date: 'asc' }, // Order by date to maintain chronological offense count
    });

    // Update each record with the correct offense count
    for (let i = 0; i < studentRecords.length; i++) {
      await prisma.record.update({
        where: { id: studentRecords[i].id },
        data: { offenseCount: i + 1 }, // 1-based counting
      });
    }
  } catch (error) {
    console.error("Error updating offense counts:", error);
  }
};

// Add function to get all records (for display)
export const getAllRecords = async (req, res) => {
  try {
    const records = await prisma.record.findMany({
      where: { isDeleted: false },
      orderBy: { date: 'desc' },
    });

    // Convert BigInt to string and format dates
    const formatted = records.map((record) => ({
      ...record,
      matricNumber: record.matricNumber.toString(),
      date: record.date?.toISOString().split('T')[0], // Format date for display
    }));

    return res.status(200).json({ records: formatted });
  } catch (err) {
    console.error("Error fetching records:", err.message);
    return res
      .status(500)
      .json({ message: "Server error: Failed to fetch records" });
  }
};