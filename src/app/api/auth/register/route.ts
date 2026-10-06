import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { apiError } from "@/lib/api";

const registrationSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  phone: z.string().trim().regex(/^[0-9+() -]{8,20}$/, "Enter a valid phone number."),
  password: z.string().min(8, "Password must be at least 8 characters.").regex(/[A-Z]/, "Password needs an uppercase letter.").regex(/[a-z]/, "Password needs a lowercase letter.").regex(/[0-9]/, "Password needs a number.").regex(/[^A-Za-z0-9]/, "Password needs a special character."),
});

export async function POST(request: Request) {
  try {
    const parsed = registrationSchema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0].message);

    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes("postgres")) {
      return apiError("Database is not configured yet. Add a valid Neon DATABASE_URL in .env and run npm run db:push before creating an account.", 500);
    }

    const email = parsed.data.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return apiError("An account already exists with this email address.", 409);
    const user = await prisma.user.create({ data: { name: parsed.data.name, email, phone: parsed.data.phone, passwordHash: await bcrypt.hash(parsed.data.password, 12), role: Role.USER } });
    const response = NextResponse.json({ user: { name: user.name, role: user.role } }, { status: 201 });
    const cookie = sessionCookie(createSessionToken(user.id, user.role));
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    const code = (error as { code?: string }).code;
    const message = error instanceof Error ? error.message : "";
    console.error("Registration error:", error);

    if (code === "P2002") return apiError("An account already exists with this email address.", 409);
    if (!process.env.DATABASE_URL || message.includes("Environment variable not found") || message.includes("Can't reach database") || message.includes("connect ECONNREFUSED") || message.includes("database is not configured")) {
      return apiError("Database is not configured yet. Add a valid Neon DATABASE_URL in .env and run npm run db:push before creating an account.", 500);
    }

    return apiError("We could not create your account. Please try again.", 500);
  }
}
