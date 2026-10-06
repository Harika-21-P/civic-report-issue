import { NextResponse } from "next/server";
import { ImageKind } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { distanceInMeters } from "@/lib/civic";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";

export async function GET(_: Request, { params }: { params: { ticketId: string } }) {
  const ticketId = params.ticketId.trim().toUpperCase();
  const complaint = await prisma.complaint.findUnique({ where: { ticketId }, include: {
    department: true, reporter: { select: { id: true, name: true, email: true, phone: true } }, images: { orderBy: { createdAt: "asc" } },
    statusHistory: { orderBy: { createdAt: "asc" } }, assignments: { include: { staff: { include: { user: true } } }, orderBy: { acceptedAt: "desc" } }, possibleDuplicate: { select: { ticketId: true, category: true, status: true } },
  } });
  if (!complaint) return apiError("No complaint was found with that ticket ID.", 404);
  const user = await getCurrentUser();
  const hasPrivateAccess = !!user && (user.role === "ADMIN" || user.id === complaint.userId || (user.role === "STAFF" && user.staffProfile?.departmentId === complaint.departmentId));
  const nearbyCandidates = await prisma.complaint.findMany({ where: { id: { not: complaint.id }, latitude: { gte: complaint.latitude - .003, lte: complaint.latitude + .003 }, longitude: { gte: complaint.longitude - .003, lte: complaint.longitude + .003 } }, select: { ticketId: true, category: true, status: true, createdAt: true, latitude: true, longitude: true, locationText: true }, take: 20 });
  const related = nearbyCandidates.map((item) => ({ ticketId: item.ticketId, category: item.category, status: item.status, createdAt: item.createdAt, locationText: item.locationText, distance: distanceInMeters(complaint.latitude, complaint.longitude, item.latitude, item.longitude) })).filter((item) => item.distance <= 250).sort((a,b)=>a.distance-b.distance);
  return NextResponse.json({ complaint: {
    ticketId: complaint.ticketId, category: complaint.category, description: complaint.description, severity: complaint.severity, status: complaint.status, locationText: complaint.locationText, landmark: complaint.landmark,
    latitude: complaint.latitude, longitude: complaint.longitude, createdAt: complaint.createdAt, completedAt: complaint.completedAt, department: complaint.department.name, departmentCode: complaint.department.code,
    images: complaint.images.map((image) => ({ kind: image.kind, dataUrl: image.dataUrl, fileName: image.fileName, createdAt: image.createdAt })), statusHistory: complaint.statusHistory, assignedTo: complaint.assignments[0]?.staff.user.name || null,
    possibleDuplicate: complaint.possibleDuplicate, related, canFeedback: !!user && user.id === complaint.userId && ["COMPLETED", "RESOLVED"].includes(complaint.status), isOwner: !!user && user.id === complaint.userId,
    ...(hasPrivateAccess ? { reporter: complaint.reporter, isFlagged: complaint.isFlagged, flagReason: complaint.flagReason } : {}),
  } });
}
