"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

// Helper to serialize Prisma Decimals and Date objects for Next.js Client components
function serializeData(data) {
  if (data === null || data === undefined) return data;
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // Handle Prisma Decimal
      if (value && typeof value === "object" && (value.d || value.s || value.e)) {
        return Number(value.d ? value.toFixed ? value.toFixed(2) : String(value) : value);
      }
      // Handle BigInt
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    })
  );
}

const registrationSchema = z.object({
  billOn: z.string().default("Patient Rate"),
  mobileNo: z.string().min(10, "Mobile number must be at least 10 digits"),
  title: z.string().min(1, "Title is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  city: z.string().default("-NA-"),
  age: z.number().min(0, "Age must be positive"),
  ageUnit: z.string().default("Year"),
  gender: z.string().min(1, "Gender is required"),
  refById: z.number().nullable().optional(),
  secondRefById: z.number().nullable().optional(),
  remark: z.string().nullable().optional(),
  colType: z.string().default("Camp"),
  expRptDate: z.string().nullable().optional(),
  sampleDate: z.string().nullable().optional(),
  sampleNo: z.string().nullable().optional(),
  sampleBy: z.string().default("-NA-"),
  paymentMode: z.string().default("Cash"),
  paymentRefNo: z.string().nullable().optional(),
  totalAmount: z.number().default(0),
  collectionCharge: z.number().default(0),
  discountPercent: z.number().default(0),
  discountAmount: z.number().default(0),
  receivedAmount: z.number().default(0),
  dueAmount: z.number().default(0),
  stickerCount: z.number().default(1),
  testIds: z.array(z.number()).min(1, "At least one test must be selected"),
});

/**
 * Fetch all available doctors.
 */
export async function getDoctors() {
  try {
    await requireAdmin("admin:view");
    const doctors = await prisma.doctor.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, doctors: serializeData(doctors) };
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return { success: false, message: error.message || "Failed to load doctors." };
  }
}

/**
 * Fetch all available tests.
 */
export async function getTests() {
  try {
    await requireAdmin("admin:view");
    const tests = await prisma.test.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, tests: serializeData(tests) };
  } catch (error) {
    console.error("Error fetching tests:", error);
    return { success: false, message: error.message || "Failed to load tests." };
  }
}

/**
 * Create a new patient registration.
 */
export async function createRegistration(rawData) {
  try {
    await requireAdmin("admin:view");

    // Validate inputs
    const validatedData = registrationSchema.parse(rawData);

    // Get the next increment for Lab ID and Reg No
    const count = await prisma.registration.count();
    const nextVal = count + 1;

    // Generate unique Lab ID and Reg No
    const labId = String(519 + nextVal);
    const regNo = `QMP-${970282932 + nextVal}`;

    // Barcode: EDT + random 9-digit
    const barcodeNumber = Math.floor(100000000 + Math.random() * 900000000);
    const barcode = `,EDT${barcodeNumber} ${barcodeNumber}`;

    // Parse Dates
    const expRptDate = validatedData.expRptDate ? new Date(validatedData.expRptDate) : null;
    const sampleDate = validatedData.sampleDate ? new Date(validatedData.sampleDate) : null;

    // Create within a transaction
    const result = await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.create({
        data: {
          billOn: validatedData.billOn,
          mobileNo: validatedData.mobileNo,
          labId,
          regNo,
          title: validatedData.title,
          name: validatedData.name,
          city: validatedData.city,
          age: validatedData.age,
          ageUnit: validatedData.ageUnit,
          gender: validatedData.gender,
          refById: validatedData.refById,
          secondRefId: validatedData.secondRefById,
          remark: validatedData.remark,
          colType: validatedData.colType,
          expRptDate,
          sampleDate,
          sampleNo: validatedData.sampleNo,
          sampleBy: validatedData.sampleBy,
          paymentMode: validatedData.paymentMode,
          paymentRefNo: validatedData.paymentRefNo,
          totalAmount: validatedData.totalAmount,
          collectionCharge: validatedData.collectionCharge,
          discountPercent: validatedData.discountPercent,
          discountAmount: validatedData.discountAmount,
          receivedAmount: validatedData.receivedAmount,
          dueAmount: validatedData.dueAmount,
          stickerCount: validatedData.stickerCount,
          barcode,
          status: validatedData.dueAmount > 0 ? "Pending" : "Completed",
        },
      });

      // Insert join table records for tests
      const registrationTests = validatedData.testIds.map((testId) => ({
        registrationId: registration.id,
        testId: testId,
      }));

      await tx.registrationTest.createMany({
        data: registrationTests,
      });

      return registration;
    });

    revalidatePath("/admin/test-report");
    revalidatePath("/admin/doctor-summary");

    return {
      success: true,
      message: `Registration saved successfully! Reg No: ${result.regNo}`,
      registration: serializeData(result),
    };
  } catch (error) {
    console.error("Error creating registration:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0]?.message || "Validation error" };
    }
    return { success: false, message: error.message || "Failed to save registration." };
  }
}

/**
 * Get all registrations with optional filters.
 */
export async function getRegistrations(filters = {}) {
  try {
    await requireAdmin("admin:view");
    const { startDate, endDate, search } = filters;

    const where = {};

    // Date filters
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Search filters (name, regNo, mobileNo)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { regNo: { contains: search } },
        { mobileNo: { contains: search } },
      ];
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        refBy: true,
        tests: {
          include: {
            test: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return { success: true, registrations: serializeData(registrations) };
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return { success: false, message: error.message || "Failed to load registrations." };
  }
}

/**
 * Get doctor referral summary statistics.
 */
export async function getDoctorReferralSummary(filters = {}) {
  try {
    await requireAdmin("admin:view");
    const { startDate, endDate } = filters;

    // Build date filter for registrations
    const regDateFilter = {};
    if (startDate) regDateFilter.gte = new Date(startDate);
    if (endDate) regDateFilter.lte = new Date(endDate);

    const hasDateFilter = startDate || endDate;

    // Fetch doctors
    const doctors = await prisma.doctor.findMany({
      orderBy: { name: "asc" },
    });

    const summary = [];

    for (const doc of doctors) {
      // Find all registrations referred by this doctor
      const whereClause = {
        refById: doc.id,
      };
      if (hasDateFilter) {
        whereClause.date = regDateFilter;
      }

      const regs = await prisma.registration.findMany({
        where: whereClause,
      });

      // If no registrations under this doctor and no date filter, still include them but with 0 count
      if (regs.length === 0 && hasDateFilter) {
        continue; // Skip doctors with 0 count when filtering by date
      }

      // Calculations
      const count = regs.length;
      const totalAmount = regs.reduce((sum, r) => sum + Number(r.totalAmount), 0);
      const totalDiscount = regs.reduce((sum, r) => sum + Number(r.discountAmount), 0);
      const netAmount = totalAmount - totalDiscount;
      const collection = regs.reduce((sum, r) => sum + Number(r.receivedAmount), 0);

      summary.push({
        id: doc.id,
        name: doc.name,
        code: doc.code || String(doc.id),
        lastPaid: doc.lastPaid ? doc.lastPaid.toISOString() : null,
        count,
        amount: totalAmount,
        discount: totalDiscount,
        netAmount,
        collection,
      });
    }

    return { success: true, summary: serializeData(summary) };
  } catch (error) {
    console.error("Error fetching doctor summary:", error);
    return { success: false, message: error.message || "Failed to load doctor referral summary." };
  }
}

/**
 * Delete a registration.
 */
export async function deleteRegistration(id) {
  try {
    await requireAdmin("admin:view");
    await prisma.registration.delete({
      where: { id }
    });

    revalidatePath("/admin/test-report");
    revalidatePath("/admin/doctor-summary");
    revalidatePath("/admin/dashboard");

    return { success: true, message: "Registration deleted successfully." };
  } catch (error) {
    console.error("Error deleting registration:", error);
    return { success: false, message: error.message || "Failed to delete registration." };
  }
}

/**
 * Fetch registration details by ID.
 */
export async function getRegistrationById(id) {
  try {
    await requireAdmin("admin:view");
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tests: true
      }
    });

    if (!registration) {
      return { success: false, message: "Registration not found." };
    }

    return { success: true, registration: serializeData(registration) };
  } catch (error) {
    console.error("Error getting registration:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Update an existing registration.
 */
export async function updateRegistration(id, rawData) {
  try {
    await requireAdmin("admin:view");

    const validatedData = registrationSchema.parse(rawData);

    const expRptDate = validatedData.expRptDate ? new Date(validatedData.expRptDate) : null;
    const sampleDate = validatedData.sampleDate ? new Date(validatedData.sampleDate) : null;

    const result = await prisma.$transaction(async (tx) => {
      // Update registration
      const registration = await tx.registration.update({
        where: { id },
        data: {
          billOn: validatedData.billOn,
          mobileNo: validatedData.mobileNo,
          title: validatedData.title,
          name: validatedData.name,
          city: validatedData.city,
          age: validatedData.age,
          ageUnit: validatedData.ageUnit,
          gender: validatedData.gender,
          refById: validatedData.refById,
          secondRefId: validatedData.secondRefById,
          remark: validatedData.remark,
          colType: validatedData.colType,
          expRptDate,
          sampleDate,
          sampleNo: validatedData.sampleNo,
          sampleBy: validatedData.sampleBy,
          paymentMode: validatedData.paymentMode,
          paymentRefNo: validatedData.paymentRefNo,
          totalAmount: validatedData.totalAmount,
          collectionCharge: validatedData.collectionCharge,
          discountPercent: validatedData.discountPercent,
          discountAmount: validatedData.discountAmount,
          receivedAmount: validatedData.receivedAmount,
          dueAmount: validatedData.dueAmount,
          stickerCount: validatedData.stickerCount,
          status: validatedData.dueAmount > 0 ? "Pending" : "Completed",
        }
      });

      // Delete old test links
      await tx.registrationTest.deleteMany({
        where: { registrationId: id }
      });

      // Add new test links
      const registrationTests = validatedData.testIds.map((testId) => ({
        registrationId: id,
        testId: testId
      }));

      await tx.registrationTest.createMany({
        data: registrationTests
      });

      return registration;
    });

    revalidatePath("/admin/test-report");
    revalidatePath("/admin/doctor-summary");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Registration updated successfully!`,
      registration: serializeData(result)
    };
  } catch (error) {
    console.error("Error updating registration:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0]?.message || "Validation error" };
    }
    return { success: false, message: error.message || "Failed to update registration." };
  }
}

/**
 * Fetch tests and sample details for a registration.
 */
export async function getRegistrationSamples(registrationId) {
  try {
    await requireAdmin("admin:view");

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        tests: {
          include: {
            test: true
          }
        }
      }
    });

    if (!registration) {
      return { success: false, message: "Registration not found." };
    }

    return { success: true, registration: serializeData(registration) };
  } catch (error) {
    console.error("Error getting registration samples:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Update sample statuses and barcodes in RegistrationTest.
 */
export async function saveSampleDetails(registrationId, sampleData) {
  try {
    await requireAdmin("admin:view");

    await prisma.$transaction(
      sampleData.map((s) =>
        prisma.registrationTest.update({
          where: {
            registrationId_testId: {
              registrationId,
              testId: s.testId
            }
          },
          data: {
            sampleStatus: s.sampleStatus,
            sampleBarcode: s.sampleBarcode,
            sampleRemark: s.sampleRemark,
            sendTo: s.sendTo || "-NA-",
            expense: s.expense !== undefined ? parseFloat(s.expense) : 0.00,
            assessNo: s.assessNo || null,
            pathologist: s.pathologist || "-NA-",
            collectedBy: s.collectedBy || "-NA-",
            product: s.product || "-NA-"
          }
        })
      )
    );

    // Check if barcode can be updated on the main Registration too
    const firstBarcode = sampleData.find(s => s.sampleBarcode)?.sampleBarcode;
    if (firstBarcode) {
      await prisma.registration.update({
        where: { id: registrationId },
        data: { barcode: firstBarcode }
      });
    }

    revalidatePath("/admin/test-report");
    return { success: true, message: "Sample details saved successfully." };
  } catch (error) {
    console.error("Error saving sample details:", error);
    return { success: false, message: error.message || "Failed to save sample details." };
  }
}

/**
 * Fetch all test parameters and any existing results for the registered tests.
 */
export async function getRegistrationTestParameters(registrationId) {
  try {
    await requireAdmin("admin:view");

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        tests: {
          include: {
            test: {
              include: {
                parameters: {
                  orderBy: { order: "asc" }
                }
              }
            }
          }
        },
        results: true
      }
    });

    if (!registration) {
      return { success: false, message: "Registration not found." };
    }

    return { success: true, registration: serializeData(registration) };
  } catch (error) {
    console.error("Error getting test parameters:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Save/update patient results in PatientResult and mark completed.
 */
export async function savePatientResults(registrationId, resultsData, reportNotes) {
  try {
    await requireAdmin("admin:view");

    await prisma.$transaction(async (tx) => {
      // 1. Upsert each patient result
      for (const res of resultsData) {
        await tx.patientResult.upsert({
          where: {
            registrationId_testParameterId: {
              registrationId,
              testParameterId: res.testParameterId
            }
          },
          update: {
            value: String(res.value)
          },
          create: {
            registrationId,
            testParameterId: res.testParameterId,
            value: String(res.value)
          }
        });
      }

      // 2. Update registration remark/notes and set status to "Completed"
      await tx.registration.update({
        where: { id: registrationId },
        data: {
          remark: reportNotes || null,
          status: "Completed"
        }
      });
    });

    revalidatePath("/admin/test-report");
    revalidatePath("/admin/doctor-summary");
    revalidatePath("/admin/dashboard");

    return { success: true, message: "Test results saved successfully." };
  } catch (error) {
    console.error("Error saving patient results:", error);
    return { success: false, message: error.message || "Failed to save results." };
  }
}

/**
 * Save/update parameter list definitions for a specific test.
 */
export async function saveTestParameters(testId, parametersList) {
  try {
    await requireAdmin("admin:view");

    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing parameters for this test
      await tx.testParameter.deleteMany({
        where: { testId }
      });

      // 2. Create the new list
      const dataToCreate = parametersList.map((param, index) => ({
        testId,
        name: param.name,
        minValMale: param.minValMale !== undefined && param.minValMale !== null && param.minValMale !== "" ? parseFloat(param.minValMale) : null,
        maxValMale: param.maxValMale !== undefined && param.maxValMale !== null && param.maxValMale !== "" ? parseFloat(param.maxValMale) : null,
        normalRangeMale: param.normalRangeMale || null,
        minValFemale: param.minValFemale !== undefined && param.minValFemale !== null && param.minValFemale !== "" ? parseFloat(param.minValFemale) : null,
        maxValFemale: param.maxValFemale !== undefined && param.maxValFemale !== null && param.maxValFemale !== "" ? parseFloat(param.maxValFemale) : null,
        normalRangeFemale: param.normalRangeFemale || null,
        minValBaby: param.minValBaby !== undefined && param.minValBaby !== null && param.minValBaby !== "" ? parseFloat(param.minValBaby) : null,
        maxValBaby: param.maxValBaby !== undefined && param.maxValBaby !== null && param.maxValBaby !== "" ? parseFloat(param.maxValBaby) : null,
        normalRangeBaby: param.normalRangeBaby || null,
        normalRangeDefault: param.normalRangeDefault || null,
        unit: param.unit || "-NA-",
        order: index + 1
      }));

      if (dataToCreate.length > 0) {
        await tx.testParameter.createMany({
          data: dataToCreate
        });
      }
    });

    return { success: true, message: "Parameters updated successfully." };
  } catch (error) {
    console.error("Error saving test parameters:", error);
    return { success: false, message: error.message || "Failed to update parameters." };
  }
}
