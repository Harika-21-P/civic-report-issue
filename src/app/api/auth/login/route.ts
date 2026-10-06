import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { apiError } from "@/lib/api";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Enter your email and password.");
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return apiError("Incorrect email or password.", 401);
    const response = NextResponse.json({ role: user.role, name: user.name });
    const cookie = sessionCookie(createSessionToken(user.id, user.role));
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch {
    return apiError("We could not sign you in. Please try again.", 500);
  }
}
