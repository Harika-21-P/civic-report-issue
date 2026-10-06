import "server-only";

import crypto from "crypto";
import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "civic_reporter_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (
    process.env.NODE_ENV === "production" &&
    (!value || value.length < 32 || value.startsWith("replace-with-"))
  ) {
    throw new Error("Set SESSION_SECRET to a unique random value of at least 32 characters in production.");
  }
  return value || "development-only-civic-reporter-secret-change-me";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, role: Role) {
  const payload = Buffer.from(JSON.stringify({ userId, role, expiresAt: Date.now() + SESSION_MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(value?: string) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId: string; role: Role; expiresAt: number };
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    options: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: SESSION_MAX_AGE },
  };
}

export function clearSessionCookie() {
  return { name: COOKIE_NAME, value: "", options: { httpOnly: true, path: "/", maxAge: 0 } };
}

export async function getCurrentUser() {
  const token = readSessionToken(cookies().get(COOKIE_NAME)?.value);
  if (!token) return null;
  return prisma.user.findUnique({
    where: { id: token.userId },
    include: { staffProfile: { include: { department: true } } },
  });
}

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (roles && !roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
