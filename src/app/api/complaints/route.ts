import { NextResponse } from "next/server";
import { ComplaintStatus, ImageKind, Severity } from "@prisma/client";
import { z } from "zod";
import { authError, apiError } from "@/lib/api";
import { getCategory, distanceInMeters } from "@/lib/civic";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidStoredImage } from "@/lib/image";

const complaintSchema = z.object({
  category: z.string(),
  description: z.string().trim().min(10, "Add at least 10 characters to describe the issue.").max(2000),
  severity: z.nativeEnum(Severity),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  locationText: z.string().trim().min(2, "Select a location or provide a location description.").max(300),
  landmark: z.string().trim().max(200).optional(),
  imageData: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/, "Upload a JPG, PNG or WebP image."),
  imageName: z.string().trim().min(1).max(120),
  possibleDuplicateTicketId: z.string().trim().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const complaints = await prisma.complaint.findMany({
      where: user.role === "USER" ? { userId: user.id } : user.role === "STAFF" ? { departmentId: user.staffProfile?.departmentId } : {},
      include: { department: true, images: { where: { kind: ImageKind.INITIAL }, take: 1 }, assignments: { include: { staff: { include: { user: true } } }, orderBy: { acceptedAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ complaints: complaints.map((complaint) => ({ ...complaint, image: complaint.images[0]?.dataUrl || null, assignedTo: complaint.assignments[0]?.staff.user.name || null })) });
  } catch (error) { return authError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["USER"]);
    const parsed = complaintSchema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0].message);
    const input = parsed.data;
    const category = getCategory(input.category);
    if (!category) return apiError("Select a valid issue category.");
    if (!isValidStoredImage(input.imageData)) return apiError("Upload a valid compressed JPG, PNG or WebP image smaller than 1.25 MB.");
    const department = await prisma.department.findUnique({ where: { code: category.departmentCode } });
    if (!department) return apiError("The mapped department is not available. Ask an administrator to seed departments.", 503);

    let possibleDuplicateId: string | undefined;
    if (input.possibleDuplicateTicketId) {
      const match = await prisma.complaint.findUnique({ where: { ticketId: input.possibleDuplicateTicketId }, select: { id: true, category: true, latitude: true, longitude: true, status: true } });
      if (match && match.category === input.category && !["COMPLETED", "RESOLVED"].includes(match.status) && distanceInMeters(input.latitude, input.longitude, match.latitude, match.longitude) <= 250) possibleDuplicateId = match.id;
    }
    const currentYear = new Date().getFullYear();
    const created = await prisma.$transaction(async (tx) => {
      const counter = await tx.ticketCounter.upsert({ where: { year: currentYear }, create: { year: currentYear, lastNumber: 1 }, update: { lastNumber: { increment: 1 } } });
      const ticketId = `CR-${currentYear}-${String(counter.lastNumber).padStart(6, "0")}`;
      return tx.complaint.create({ data: {
        ticketId, userId: user.id, departmentId: department.id, category: input.category, description: input.description,
        severity: input.severity, latitude: input.latitude, longitude: input.longitude, locationText: input.locationText,
        landmark: input.landmark || null, possibleDuplicateId,
        images: { create: { kind: ImageKind.INITIAL, dataUrl: input.imageData, fileName: input.imageName, mimeType: input.imageData.slice(5, input.imageData.indexOf(";")) } },
        statusHistory: { create: { status: ComplaintStatus.SUBMITTED, message: "Complaint submitted through Civic Reporter.", actorName: user.name, departmentName: department.name } },
      }, include: { department: true } });
    });
    return NextResponse.json({ ticketId: created.ticketId, category: created.category, department: created.department.name, locationText: created.locationText, status: created.status, createdAt: created.createdAt }, { status: 201 });
  } catch (error) { return authError(error); }
}
