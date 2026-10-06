"use client";

import Link from "next/link";
import { useState } from "react";

export default function ReportSuccessPage({ params }: { params: { ticketId: string } }) {
  const [copied,setCopied]=useState(false); const ticketId=params.ticketId.toUpperCase();
  return <div className="page"><div className="container content form-shell"><div className="form-card"><div className="eyebrow">Report received</div><h1 style={{fontSize:34}}>Complaint Submitted Successfully</h1><p className="muted">Your report has been sent to the mapped department. Keep this ticket ID to follow every update.</p><div className="detail-list"><div><span>Ticket ID</span><strong className="ticket">{ticketId}</strong></div><div><span>Current status</span><strong>Submitted</strong></div><div><span>Next step</span><strong>Department review</strong></div></div><div className="hero-actions"><button className="button secondary" onClick={async()=>{await navigator.clipboard.writeText(ticketId);setCopied(true);}}>{copied?"Copied":"Copy Ticket ID"}</button><Link href={`/track/${ticketId}`} className="button">Track Complaint</Link><Link href="/dashboard" className="button quiet">My Complaints</Link></div></div></div></div>;
}
