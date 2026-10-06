import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PortalShell from "@/components/PortalShell";
export const dynamic="force-dynamic";
export default async function StaffLayout({children}:{children:React.ReactNode}){const user=await getCurrentUser();if(!user)redirect("/login?next=/staff");if(user.role!=="STAFF")redirect(user.role==="ADMIN"?"/admin":"/dashboard");return <PortalShell role="STAFF" name={user.name} department={user.staffProfile?.department.name}>{children}</PortalShell>;}
