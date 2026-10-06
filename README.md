# Civic Reporter

**CIVIC REPORTER** is a single-repository Next.js civic complaint platform.
Citizens report an issue with a map location and image; the app routes it to a
department, creates a ticket, checks nearby reports, and preserves every staff
status update in Neon PostgreSQL.

## Local setup

1. Create a Neon PostgreSQL database and copy its pooled `postgresql://` connection string.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and a long `SESSION_SECRET`.
3. Install and initialise the database:

   ```powershell
   npm install
   npm run db:push
   npm run db:seed
   npm run dev
   ```

4. Open `http://localhost:3000`.

`db:push` is intentionally used for the fast college-expo setup. For a team or
production change-management workflow, use `npm run db:migrate` to create a
reviewed migration, then apply it with `npx prisma migrate deploy` before
deploying the application.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Server-only Neon PostgreSQL connection string. |
| `SESSION_SECRET` | A random 32+ character secret used to sign HTTP-only login cookies. |

The demo account password variables in `.env.example` are optional, server-side
seed configuration. They default only when running the seed command and are
never sent to the browser.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin011@gmail.com` | `admin@123` |
| Roads staff | `road@gmail.com` | `road@123` |
| Electrical staff | `electrical@gmail.com` | `electrical@123` |
| Water staff | `water@gmail.com` | `water@123` |
| Waste staff | `waste@gmail.com` | `waste@123` |
| Drainage staff | `drainage@gmail.com` | `drainage@123` |

The seed also creates `citizen.demo@example.com` / `Citizen@123` and nearby
sample reports around central Mumbai so duplicate-report behaviour can be
demonstrated. Change all demo passwords before any non-expo deployment.

## Vercel

1. Import this repository into Vercel.
2. Set `DATABASE_URL` and `SESSION_SECRET` in Vercel project environment variables.
3. Apply the schema once from a trusted machine or CI: `npm run db:push`.
4. Use the default build command, `npm run build`; it runs `prisma generate`
   before `next build`.

No local uploads directory is used. Client images are resized to JPEG in the
browser, validated again on the server, and saved in PostgreSQL text storage.
This is deliberately suitable for small expo images, not a high-volume media
service. For large-scale production, move images to object storage and retain
their URLs in `ComplaintImage`.

## Main implementation areas

- `prisma/schema.prisma`: Neon relational schema and lifecycle history.
- `prisma/seed.ts`: departments, accounts, nearby demo reports and feedback.
- `src/app/api`: authenticated route handlers for all database operations.
- `src/app/(public)`: public landing, reporting and ticket tracking UI.
- `src/app/dashboard`, `src/app/admin`, `src/app/staff`: role-scoped portals.
- `src/components`: maps, image compression/upload, tables, timelines and actions.
