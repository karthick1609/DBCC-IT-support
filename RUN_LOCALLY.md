# Run Locally

Prerequisites:
- Node.js 18+ and npm
- Vercel CLI (optional but recommended)
- A Supabase project with credentials

Steps:

1. Install dependencies

```powershell
npm install
```

2. Create `.env` from `.env.example` and fill values (SUPABASE_URL, keys, DATABASE_URL, etc.)

3. Initialize Supabase schema (run these in Supabase SQL Editor):

- `database/schema.sql`
- `database/seed.sql`
- `database/rls.sql`

4. Create Storage buckets in Supabase: `ticket-attachments`, `asset-images`, `asset-documents`.

5. Start local dev server (Vercel emulates serverless functions)

```powershell
npx vercel dev
```

6. Open http://localhost:3000 and the frontend at `/frontend/index.html`.

Troubleshooting:
- If `vercel dev` is not available, install with `npm i -g vercel`.
- Ensure `.env` is properly set and `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed publicly.
