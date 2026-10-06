import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { dashboardSummary } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import ComplaintTable from "@/components/ComplaintTable";

export default async function UserDashboardPage() { const user=await getCurrentUser();if(!user)return null;const [summary,complaints]=await Promise.all([dashboardSummary(user.id),prisma.complaint.findMany({where:{userId:user.id},include:{department:true,images:{take:1}},orderBy:{createdAt:"desc"},take:5})]);return <><h1>Your civic reports</h1><p className="dashboard-subtitle">Report an issue, track updates and share feedback after completion.</p><div className="summary-grid">{[[summary.all,"Total complaints"],[summary.pending,"Pending"],[summary.inProgress,"In progress"],[summary.resolved,"Resolved"]].map(([number,label])=><div className="summary-card" key={String(label)}><span className="label">{label}</span><span className="number">{number}</span></div>)}</div><div className="toolbar"><h2 style={{margin:0,fontSize:21}}>Recent complaints</h2><Link className="button small" href="/report">Report an Issue</Link></div><ComplaintTable complaints={complaints.map(c=>({...c,image:c.images[0]?.dataUrl||null}))}/></>; }
