import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, authError } from "@/lib/api";

const feedbackSchema = z.object({ rating: z.number().int().min(1).max(5).optional(), wentWell: z.string().trim().max(1000).optional(), improve: z.string().trim().max(1000).optional(), comments: z.string().trim().max(2000).optional() });

export async function POST(request: Request, { params }: { params: { ticketId: string } }) {
  try {
    const user = await requireUser(["USER"]);
    const input = feedbackSchema.safeParse(await request.json());
    if (!input.success) return apiError(input.error.issues[0].message);
    if (!input.data.rating && !input.data.wentWell && !input.data.improve && !input.data.comments) return apiError("Add a rating or some feedback before submitting.");
    const complaint = await prisma.complaint.findUnique({ where: { ticketId: params.ticketId.toUpperCase() } });
    if (!complaint) return apiError("Complaint not found.", 404);
    if (complaint.userId !== user.id) return apiError("You can only give feedback on your own complaint.", 403);
    if (!["COMPLETED", "RESOLVED"].includes(complaint.status)) return apiError("Feedback opens once the complaint is completed.", 409);
    const feedback = await prisma.feedback.upsert({ where: { complaintId: complaint.id }, update: input.data, create: { complaintId: complaint.id, userId: user.id, ...input.data } });
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) { return authError(error); }
}
