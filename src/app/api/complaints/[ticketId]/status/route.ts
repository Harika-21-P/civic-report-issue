import { NextResponse } from "next/server";
import { ComplaintStatus, ImageKind } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, authError } from "@/lib/api";
import { isValidStoredImage } from "@/lib/image";

const actionSchema = z.object({ action: z.enum(["ACCEPT", "START", "COMPLETE"]), note: z.string().trim().max(1500).optional(), imageData: z.string().optional(), imageName: z.string().max(120).optional() });

export async function POST(request: Request, { params }: { params: { ticketId: string } }) {
  try {
    const user = await requireUser(["STAFF"]);
    const staff = user.staffProfile;
    if (!staff) return apiError("This staff account is not associated with a department.", 403);
    const input = actionSchema.safeParse(await request.json());
    if (!input.success) return apiError(input.error.issues[0].message);
    const complaint = await prisma.complaint.findUnique({ where: { ticketId: params.ticketId.toUpperCase() }, include: { department: true, assignments: { orderBy: { acceptedAt: "desc" } } } });
    if (!complaint) return apiError("Complaint not found.", 404);
    if (complaint.departmentId !== staff.departmentId) return apiError("This complaint belongs to another department.", 403);
    const ownAssignment = complaint.assignments.find((assignment) => assignment.staffId === staff.id);
    const otherAssignment = complaint.assignments.find((assignment) => assignment.staffId !== staff.id && !assignment.completedAt);
    let nextStatus: ComplaintStatus; let message: string;
    if (input.data.action === "ACCEPT") {
      if (ownAssignment) return apiError("You have already accepted this complaint.", 409);
      if (otherAssignment) return apiError("Another staff member has already accepted this complaint.", 409);
      if (complaint.status === ComplaintStatus.COMPLETED || complaint.status === ComplaintStatus.RESOLVED) return apiError("Completed complaints cannot be accepted.", 409);
      nextStatus = ComplaintStatus.ACCEPTED; message = input.data.note || "Complaint accepted by department staff.";
    } else if (input.data.action === "START") {
      if (!ownAssignment) return apiError("Accept this complaint before starting work.", 409);
      if (complaint.status !== ComplaintStatus.ACCEPTED && complaint.status !== ComplaintStatus.ASSIGNED) return apiError("Only an accepted complaint can be started.", 409);
      nextStatus = ComplaintStatus.IN_PROGRESS; message = input.data.note || "Work has started on this complaint.";
    } else {
      if (!ownAssignment) return apiError("Only the assigned staff member can complete this complaint.", 403);
      if (complaint.status !== ComplaintStatus.IN_PROGRESS) return apiError("Start work before completing the complaint.", 409);
      if (!input.data.note || input.data.note.length < 5) return apiError("Add a short completion note.");
      if (!input.data.imageData || !isValidStoredImage(input.data.imageData)) return apiError("Upload a valid compressed JPG, PNG or WebP completion photograph.");
      nextStatus = ComplaintStatus.COMPLETED; message = input.data.note;
    }
    await prisma.$transaction(async (tx) => {
      if (input.data.action === "ACCEPT") await tx.complaintAssignment.create({ data: { complaintId: complaint.id, staffId: staff.id, departmentId: staff.departmentId } });
      if (input.data.action === "COMPLETE") {
        await tx.complaintImage.create({ data: { complaintId: complaint.id, kind: ImageKind.COMPLETION, dataUrl: input.data.imageData!, fileName: input.data.imageName || "completion.jpg", mimeType: input.data.imageData!.slice(5, input.data.imageData!.indexOf(";")) } });
        await tx.complaintAssignment.updateMany({ where: { complaintId: complaint.id, staffId: staff.id }, data: { completedAt: new Date() } });
      }
      await tx.complaint.update({ where: { id: complaint.id }, data: { status: nextStatus!, completedAt: input.data.action === "COMPLETE" ? new Date() : undefined } });
      await tx.complaintStatusHistory.create({ data: { complaintId: complaint.id, status: nextStatus!, message, actorName: user.name, departmentName: complaint.department.name } });
    }, { timeout: 20000, maxWait: 20000 });
    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (error) { return authError(error); }
}
