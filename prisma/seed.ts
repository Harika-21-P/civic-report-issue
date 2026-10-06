import { PrismaClient, Role, Severity, ComplaintStatus, ImageKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const hash = (password: string) => bcrypt.hash(password, 12);

const departments = [
  ["ROADS", "Roads & Transport", "Road maintenance, potholes and footpaths", ["ROAD_POTHOLE"]],
  ["ELECTRICAL", "Electrical", "Streetlights, poles and electrical hazards", ["STREETLIGHT"]],
  ["WATER", "Water Supply", "Water leakage and municipal water supply", ["WATER_LEAKAGE"]],
  ["DRAINAGE", "Sanitation & Drainage", "Drainage overflow and sewage", ["DRAINAGE"]],
  ["WASTE", "Waste Management", "Garbage collection and dumping", ["GARBAGE"]],
  ["SANITATION", "Municipal Sanitation", "Public cleaning and roadside dust", ["UNCLEAN_AREA"]],
  ["INFRA", "Public Infrastructure", "Footpaths and public infrastructure", ["FOOTPATH"]],
  ["DISASTER", "Storm & Disaster Response", "Fallen trees and storm damage", ["STORM_DAMAGE"]],
] as const;

const tinyImage = "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#e8edf1"/><path d="M0 360h800" stroke="#8595a2" stroke-width="90"/><circle cx="410" cy="380" r="65" fill="#384550"/><text x="40" y="85" font-size="36" fill="#25323d" font-family="Arial">Civic Reporter demo photo</text></svg>`).toString("base64");

async function user(email: string, name: string, phone: string, password: string, role: Role) {
  return prisma.user.upsert({ where: { email }, update: { name, phone, role, passwordHash: await hash(password) }, create: { email, name, phone, role, passwordHash: await hash(password) } });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    const requiredVariables = [
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
      "ROAD_STAFF_PASSWORD",
      "ELECTRICAL_STAFF_PASSWORD",
      "WATER_STAFF_PASSWORD",
      "WASTE_STAFF_PASSWORD",
      "DRAINAGE_STAFF_PASSWORD",
    ] as const;
    const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());
    if (missingVariables.length > 0) {
      throw new Error(`Production seeding requires explicit values for: ${missingVariables.join(", ")}.`);
    }

    const weakPasswords = requiredVariables
      .filter((name) => name.endsWith("_PASSWORD"))
      .filter((name) => (process.env[name]?.length ?? 0) < 16);
    if (weakPasswords.length > 0) {
      throw new Error(`Use unique passwords of at least 16 characters for: ${weakPasswords.join(", ")}.`);
    }
  }

  for (const [code, name, description, categories] of departments) {
    await prisma.department.upsert({ where: { code }, update: { name, description, categories: [...categories] }, create: { code, name, description, categories: [...categories] } });
  }
  const byCode = Object.fromEntries((await prisma.department.findMany()).map((department) => [department.code, department]));

  const admin = await user(process.env.ADMIN_EMAIL || "admin011@gmail.com", "Civic Reporter Administrator", "9000000001", process.env.ADMIN_PASSWORD || "admin@123", Role.ADMIN);
  const staff = [
    ["road@gmail.com", "Road Department Officer", "ROADS", process.env.ROAD_STAFF_PASSWORD || "road@123"],
    ["electrical@gmail.com", "Electrical Department Officer", "ELECTRICAL", process.env.ELECTRICAL_STAFF_PASSWORD || "electrical@123"],
    ["water@gmail.com", "Water Department Officer", "WATER", process.env.WATER_STAFF_PASSWORD || "water@123"],
    ["waste@gmail.com", "Waste Management Officer", "WASTE", process.env.WASTE_STAFF_PASSWORD || "waste@123"],
    ["drainage@gmail.com", "Drainage Department Officer", "DRAINAGE", process.env.DRAINAGE_STAFF_PASSWORD || "drainage@123"],
  ] as const;
  for (const [email, name, departmentCode, password] of staff) {
    const employee = await user(email, name, "9000000002", password, Role.STAFF);
    await prisma.staffProfile.upsert({ where: { userId: employee.id }, update: { departmentId: byCode[departmentCode].id, title: "Department Officer" }, create: { userId: employee.id, departmentId: byCode[departmentCode].id, title: "Department Officer" } });
  }

  if (process.env.NODE_ENV !== "production") {
    const citizen = await user("citizen.demo@example.com", "Demo Citizen", "9000000010", "Citizen@123", Role.USER);
    const existing = await prisma.complaint.count();
    if (!existing) {
      const samples = [
        ["CR-2026-000001", "ROAD_POTHOLE", "ROADS", "Large pothole near the bus stop. It fills with water after rain.", 19.07605, 72.87760, "Near Central Bus Stop", ComplaintStatus.IN_PROGRESS],
        ["CR-2026-000002", "ROAD_POTHOLE", "ROADS", "Deep pothole beside the same junction.", 19.07670, 72.87785, "Central Junction", ComplaintStatus.SUBMITTED],
        ["CR-2026-000003", "STREETLIGHT", "ELECTRICAL", "Streetlight has been off for three nights.", 19.07820, 72.88050, "Market Road", ComplaintStatus.ASSIGNED],
        ["CR-2026-000004", "WATER_LEAKAGE", "WATER", "Water leaking from the main pipeline.", 19.07390, 72.87560, "Park Lane", ComplaintStatus.RESOLVED],
      ] as const;
      for (const [ticketId, category, code, description, latitude, longitude, locationText, status] of samples) {
        const complaint = await prisma.complaint.create({ data: { ticketId, category, description, latitude, longitude, locationText, severity: Severity.HIGH, status, userId: citizen.id, departmentId: byCode[code].id } });
        await prisma.complaintImage.create({ data: { complaintId: complaint.id, kind: ImageKind.INITIAL, dataUrl: tinyImage, fileName: "demo-issue.svg", mimeType: "image/svg+xml" } });
        await prisma.complaintStatusHistory.create({ data: { complaintId: complaint.id, status: ComplaintStatus.SUBMITTED, message: "Complaint submitted through Civic Reporter.", actorName: citizen.name, departmentName: byCode[code].name } });
        if (status !== ComplaintStatus.SUBMITTED) await prisma.complaintStatusHistory.create({ data: { complaintId: complaint.id, status, message: status === ComplaintStatus.RESOLVED ? "Issue has been resolved." : "Department is processing this issue.", actorName: "Department team", departmentName: byCode[code].name } });
      }
      await prisma.ticketCounter.upsert({ where: { year: 2026 }, update: { lastNumber: 4 }, create: { year: 2026, lastNumber: 4 } });
      const resolved = await prisma.complaint.findUniqueOrThrow({ where: { ticketId: "CR-2026-000004" } });
      await prisma.feedback.create({ data: { complaintId: resolved.id, userId: citizen.id, rating: 5, wentWell: "The repair team was prompt.", improve: "A clearer arrival estimate would help.", comments: "Thank you for fixing the water leak.", category: "Complaint service" } });
    }
  }
  console.log(`Seeded Civic Reporter accounts. Admin ID: ${admin.id}`);
}

main().finally(() => prisma.$disconnect());
