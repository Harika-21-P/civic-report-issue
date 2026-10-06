"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); setLoading(true); try { const response = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,password}) }); const data = await response.json(); if (!response.ok) { setError(data.error || "Unable to sign in."); return; } const next = new URLSearchParams(window.location.search).get("next"); const base = data.role === "ADMIN" ? "/admin" : data.role === "STAFF" ? "/staff" : "/dashboard"; router.push(next?.startsWith("/") ? next : base); router.refresh(); } catch { setError("Network error. Please try again."); } finally { setLoading(false); } };
  return <main className="auth-layout"><form className="auth-card" onSubmit={submit}><Brand/><h1 style={{fontSize:30}}>Welcome back</h1><p className="muted">Sign in to report, track or manage civic issues.</p>{error&&<div className="alert error">{error}</div>}<div className="field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></div><button className="button" style={{width:"100%"}} disabled={loading}>{loading?"Signing in…":"Sign in"}</button><p className="auth-links">New to Civic Reporter? <Link href="/register">Create a citizen account</Link></p><p className="auth-links"><Link href="/track">Track a complaint without signing in</Link></p></form></main>;
}
