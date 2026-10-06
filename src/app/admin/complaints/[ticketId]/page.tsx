import ComplaintDetail from "@/components/ComplaintDetail";
import AdminComplaintActions from "@/components/AdminComplaintActions";
import { prisma } from "@/lib/prisma";

export default async function AdminComplaintPage({params}:{params:{ticketId:string}}){const [departments,complaint]=await Promise.all([prisma.department.findMany({select:{code:true,name:true},orderBy:{name:"asc"}}),prisma.complaint.findUnique({where:{ticketId:params.ticketId.toUpperCase()},include:{department:true}})]);return <><div className="toolbar"><div><h1>Complaint review</h1><p className="dashboard-subtitle">Review routing, location, images and status history.</p></div></div>{complaint&&<div style={{marginBottom:18}}><AdminComplaintActions ticketId={complaint.ticketId} departments={departments} currentCode={complaint.department.code}/></div>}<ComplaintDetail ticketId={params.ticketId}/></>;}
