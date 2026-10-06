import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PortalShell from "@/components/PortalShell";
export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}){const user=await getCurrentUser();if(!user)redirect("/login?next=/admin");if(user.role!=="ADMIN")redirect(user.role==="STAFF"?"/staff":"/dashboard");return <PortalShell role="ADMIN" name={user.name}>{children}</PortalShell>;}
