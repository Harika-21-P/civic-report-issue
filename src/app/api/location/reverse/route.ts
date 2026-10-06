import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url); const lat = Number(searchParams.get("lat")); const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return apiError("Invalid coordinates.");
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, { headers: { "User-Agent": "CivicReporterExpo/1.0" }, next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("Lookup unavailable");
    const data = await response.json() as { display_name?: string };
    return NextResponse.json({ locationText: data.display_name || `Selected point near ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  } catch { return NextResponse.json({ locationText: `Selected point near ${lat.toFixed(5)}, ${lng.toFixed(5)}`, fallback: true }); }
}
