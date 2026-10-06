import Link from "next/link";
import { ISSUE_CATEGORIES } from "@/lib/civic";
import { publicStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

const icons = ["▰", "☼", "◒", "≈", "♻", "✦", "▱", "♧"];

export default async function HomePage() {
  const stats = await publicStats();
  return <div className="page">
    <section className="hero"><div className="container hero-grid"><div><div className="eyebrow">A public service for better neighbourhoods</div><h1>Report Civic Problems. Get Them to the Right Department.</h1><p className="lead">Report potholes, drainage issues, broken streetlights, garbage dumping, water leakage and other local problems. Civic Reporter gives every issue a ticket, a department and a clear path to resolution.</p><div className="hero-actions"><Link href="/report" className="button">Report an Issue</Link><Link href="/track" className="button secondary">Track a Complaint</Link></div></div>
      <aside className="hero-panel"><div className="eyebrow">How it helps</div><h3>A clearer route from report to repair.</h3><div className="hero-check"><span className="check">✓</span><span>Issues route to the responsible municipal department.</span></div><div className="hero-check"><span className="check">✓</span><span>Nearby reports make potential duplicates visible before you submit.</span></div><div className="hero-check"><span className="check">✓</span><span>Follow every staff update with one simple ticket ID.</span></div></aside>
    </div></section>
    <section className="section"><div className="container"><div className="stats"><div className="stat"><strong>{stats.total.toLocaleString("en-IN")}</strong><span>Complaints reported</span></div><div className="stat"><strong>{stats.resolved.toLocaleString("en-IN")}</strong><span>Issues resolved</span></div><div className="stat"><strong>{stats.departments}</strong><span>Departments connected</span></div><div className="stat"><strong>{stats.active.toLocaleString("en-IN")}</strong><span>Active reports</span></div></div></div></section>
    <section id="how-it-works" className="section soft"><div className="container"><div className="section-heading"><div className="eyebrow">How it works</div><h2>Simple for citizens. Clear for departments.</h2><p>No black box: the selected issue type determines the responsible department, and every status change is recorded.</p></div><div className="grid-4">{["Report the issue", "Confirm the location", "Check nearby reports", "Department handles it"].map((title, index) => <article className="card" key={title}><div className="step-number">0{index + 1}</div><h3>{title}</h3><p className="muted">{["Add a category, photograph, description and severity.", "Use your current position or drop a pin precisely on the map.", "See relevant reports within 200 metres before sending yours.", "The assigned team accepts, updates and completes the work."][index]}</p></article>)}</div></div></section>
    <section className="section"><div className="container"><div className="section-heading"><div className="eyebrow">What you can report</div><h2>Everyday local issues, organised clearly.</h2></div><div className="grid-4">{ISSUE_CATEGORIES.map((category, index) => <article className="card" key={category.value}><div className="category-icon">{icons[index]}</div><h3>{category.label}</h3><p className="muted small-text">Routed to the right public-service team.</p></article>)}</div></div></section>
    <section className="section soft"><div className="container"><div className="section-heading"><div className="eyebrow">Connected departments</div><h2>One report, the right desk.</h2><p>Routing is transparent: each category has a predefined responsible department.</p></div><Link className="button secondary" href="/departments">View supported departments</Link></div></section>
  </div>;
}
