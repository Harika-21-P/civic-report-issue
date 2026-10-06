"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Brand() {
  return <Link href="/" className="brand"><span className="brand-mark">CR</span><span>CIVIC REPORTER</span></Link>;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); };
  const isPortal = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/staff");
  return <header className="site-header"><div className="container header-row"><Brand />
    <nav className="public-nav" aria-label="Primary navigation"><Link href="/">Home</Link><Link href="/#how-it-works">How It Works</Link><Link href="/departments">Departments</Link><Link href="/track">Track Complaint</Link></nav>
    <div className="header-actions">{isPortal ? <button onClick={logout} className="button quiet small">Sign out</button> : <><Link href="/login" className="button secondary small">Login</Link><Link href="/report" className="button small">Report an Issue</Link></>}</div>
    <button className="mobile-nav" aria-label="Navigation" onClick={() => document.getElementById("mobile-links")?.classList.toggle("hidden")}>Menu</button>
  </div><div id="mobile-links" className="container hidden" style={{ paddingBottom: 12 }}><div className="filters"><Link href="/">Home</Link><Link href="/departments">Departments</Link><Link href="/track">Track</Link><Link href="/report">Report</Link></div></div></header>;
}
