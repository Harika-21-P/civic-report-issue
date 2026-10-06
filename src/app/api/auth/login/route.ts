import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { apiError } from "@/lib/api";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  let stage = "request_parsing";
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Enter your email and password.");

    stage = "user_lookup";
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

    stage = "password_validation";
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return apiError("Incorrect email or password.", 401);

    stage = "session_creation";
    const response = NextResponse.json({ role: user.role, name: user.name });
    const cookie = sessionCookie(createSessionToken(user.id, user.role));
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    const secret = process.env.SESSION_SECRET;
    const sessionSecretStatus =
      !secret ? "missing" : secret.length < 32 ? "too_short" : secret.startsWith("replace-with-") ? "placeholder" : "valid";
    const errorCode =
      error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? error.code
        : undefined;

    console.error("Login request failed.", {
      stage,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode,
      ...(stage === "session_creation" ? { sessionSecretStatus } : {}),
    });
    return apiError("We could not sign you in. Please try again.", 500);
  }
}
