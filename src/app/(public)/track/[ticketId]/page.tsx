import ComplaintDetail from "@/components/ComplaintDetail";

export default function TicketPage({ params }: { params: { ticketId: string } }) { return <div className="page"><div className="container content"><ComplaintDetail ticketId={params.ticketId}/></div></div>; }
