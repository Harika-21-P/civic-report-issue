import { NextResponse } from "next/server";
import { ImageKind } from "@prisma/client";
import { distanceInMeters } from "@/lib/civic";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat")); const longitude = Number(searchParams.get("lng")); const category = searchParams.get("category") || "";
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return apiError("Choose a valid location first.");
  const radius = 250;
  const latitudeDelta = radius / 111_320;
  const longitudeDelta = radius / (111_320 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.1));
  try {
    const candidates = await prisma.complaint.findMany({
      where: { latitude: { gte: latitude - latitudeDelta, lte: latitude + latitudeDelta }, longitude: { gte: longitude - longitudeDelta, lte: longitude + longitudeDelta } },
      include: { images: { where: { kind: ImageKind.INITIAL }, take: 1 } }, take: 30,
    });
    const reports = candidates.map((complaint) => ({
      ticketId: complaint.ticketId, category: complaint.category, status: complaint.status, locationText: complaint.locationText,
      createdAt: complaint.createdAt, distance: distanceInMeters(latitude, longitude, complaint.latitude, complaint.longitude), image: complaint.images[0]?.dataUrl || null,
    })).filter((complaint) => complaint.distance <= radius).sort((a, b) => a.distance - b.distance);
    return NextResponse.json({ radius, reports, similar: reports.filter((report) => report.category === category && !["COMPLETED", "RESOLVED"].includes(report.status)) });
  } catch { return apiError("We could not check nearby reports right now.", 500); }
}
