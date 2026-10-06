import { ImageKind } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StaffComplaintCard from "@/components/StaffComplaintCard";

export default async function AssignedWorkPage(){const user=await getCurrentUser();const staffId=user?.staffProfile?.id;if(!staffId)return <div className="alert error">Your account has no staff profile.</div>;const assignments=await prisma.complaintAssignment.findMany({where:{staffId},include:{complaint:{include:{images:{where:{kind:ImageKind.INITIAL},take:1}}}},orderBy:{acceptedAt:"desc"}});return <><h1>My assigned work</h1><p className="dashboard-subtitle">Accept a report, start work, then add a repair note and completion photograph.</p>{assignments.length?assignments.map(({complaint})=><StaffComplaintCard key={complaint.id} complaint={{...complaint,createdAt:complaint.createdAt.toISOString(),images:complaint.images.map(i=>({dataUrl:i.dataUrl}))}} assigned/>):<div className="empty">You have not accepted any complaints yet.</div>}</>;}
