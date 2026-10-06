import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ReportForm from "@/components/ReportForm";
import PortalShell from "@/components/PortalShell";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/report");
  if (user.role !== "USER") redirect(user.role === "ADMIN" ? "/admin" : "/staff");
  return <PortalShell role="USER" name={user.name}><div className="page"><div className="page-head"><div className="container"><h1>Report an issue</h1><p>Add the essential details below. You can review existing nearby reports before submitting.</p></div></div><div className="container content"><ReportForm /></div></div></PortalShell>;
}
