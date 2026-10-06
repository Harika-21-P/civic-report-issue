import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, authError } from "@/lib/api";

const generalSchema = z.object({ improve: z.string().trim().max(1500).optional(), comments: z.string().trim().max(2000).optional() });
export async function POST(request: Request) { try { const user=await requireUser(["USER"]);const parsed=generalSchema.safeParse(await request.json());if(!parsed.success)return apiError(parsed.error.issues[0].message);if(!parsed.data.improve&&!parsed.data.comments)return apiError("Share at least one suggestion or difficulty.");const feedback=await prisma.feedback.create({data:{userId:user.id,improve:parsed.data.improve,comments:parsed.data.comments,category:"Platform feedback"}});return NextResponse.json({feedback},{status:201});}catch(error){return authError(error);} }
