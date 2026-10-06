import { NextResponse } from "next/server";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function authError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return apiError("Please sign in to continue.", 401);
  if (error instanceof Error && error.message === "FORBIDDEN") return apiError("You do not have access to this action.", 403);
  return apiError("The service could not complete that request. Please try again.", 500);
}
