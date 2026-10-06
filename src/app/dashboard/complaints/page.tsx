import Link from "next/link";
import { ComplaintStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ComplaintTable from "@/components/ComplaintTable";

const filters=["ALL","SUBMITTED","ASSIGNED","IN_PROGRESS","COMPLETED","RESOLVED"] as const;
export default async function MyComplaintsPage({searchParams}:{searchParams:{status?:string}}) { const user=await getCurrentUser();if(!user)return null;const status=filters.includes(searchParams.status as typeof filters[number])?searchParams.status!:"ALL";const where={userId:user.id,...(status!=="ALL"?{status:status as ComplaintStatus}:{})};const complaints=await prisma.complaint.findMany({where,include:{department:true,images:{take:1}},orderBy:{createdAt:"desc"}});return <><div className="toolbar"><div><h1>My complaints</h1><p className="dashboard-subtitle">Every report you submitted, from first ticket to final update.</p></div><Link href="/report" className="button">Report an Issue</Link></div><div className="toolbar"><div className="filters">{filters.map(filter=><Link key={filter} href={filter==="ALL"?"/dashboard/complaints":`/dashboard/complaints?status=${filter}`} className={`filter ${filter===status?"active":""}`}>{filter.replaceAll("_"," ")}</Link>)}</div></div><ComplaintTable complaints={complaints.map(c=>({...c,image:c.images[0]?.dataUrl||null}))}/></>; }
