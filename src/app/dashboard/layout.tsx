import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PortalShell from "@/components/PortalShell";

export const dynamic="force-dynamic";
export default async function UserDashboardLayout({children}:{children:React.ReactNode}) { const user=await getCurrentUser();if(!user)redirect("/login?next=/dashboard");if(user.role!=="USER")redirect(user.role==="ADMIN"?"/admin":"/staff");return <PortalShell role="USER" name={user.name}>{children}</PortalShell>; }
