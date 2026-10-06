import "server-only";

import { ComplaintStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function publicStats() {
  try {
    const [total, resolved, active, departments] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: { in: [ComplaintStatus.COMPLETED, ComplaintStatus.RESOLVED] } } }),
      prisma.complaint.count({ where: { status: { notIn: [ComplaintStatus.COMPLETED, ComplaintStatus.RESOLVED] } } }),
      prisma.department.count(),
    ]);
    return { total, resolved, active, departments };
  } catch {
    return { total: 0, resolved: 0, active: 0, departments: 0 };
  }
}

export async function dashboardSummary(userId: string) {
  const all = await prisma.complaint.count({ where: { userId } });
  const pending = await prisma.complaint.count({ where: { userId, status: { in: [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW, ComplaintStatus.ASSIGNED, ComplaintStatus.ACCEPTED] } } });
  const inProgress = await prisma.complaint.count({ where: { userId, status: ComplaintStatus.IN_PROGRESS } });
  const resolved = await prisma.complaint.count({ where: { userId, status: { in: [ComplaintStatus.COMPLETED, ComplaintStatus.RESOLVED] } } });
  return { all, pending, inProgress, resolved };
}
