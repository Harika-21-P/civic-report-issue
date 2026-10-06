import { prisma } from "@/lib/prisma";
import { ISSUE_CATEGORIES } from "@/lib/civic";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } }).catch(() => []);
  return <div className="page"><div className="page-head"><div className="container"><h1>Departments</h1><p>Issue categories route to the municipal team responsible for handling them.</p></div></div><div className="container content"><div className="grid-3">{departments.map((department) => <article className="card" key={department.id}><div className="eyebrow">{department.code}</div><h3>{department.name}</h3><p className="muted">{department.description}</p><p className="small-text"><strong>Handles: </strong>{department.categories.map((value) => ISSUE_CATEGORIES.find((item) => item.value === value)?.label || value).join(", ")}</p></article>)}</div>{!departments.length && <div className="empty">Departments will appear after the database is configured and seeded.</div>}</div></div>;
}
