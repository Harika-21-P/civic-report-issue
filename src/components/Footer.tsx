import Link from "next/link";
import { Brand } from "@/components/Header";

export default function Footer() {
  return <footer className="site-footer"><div className="container footer-row"><Brand /><span>You report the problem. We navigate the bureaucracy.</span><span><Link href="/track">Track a complaint</Link> · <Link href="/departments">Departments</Link></span></div></footer>;
}
