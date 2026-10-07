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

2. Set these values in `.env` (locally) and in Vercel Project Settings → Environment Variables (deployed):

   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side secret; never expose it in frontend code)

3. Initialize Supabase schema (run these in Supabase SQL Editor):

- `database/schema.sql`
- `database/seed.sql`
- `database/rls.sql`

4. Create Storage buckets in Supabase: `ticket-attachments`, `asset-images`, `asset-documents`.

5. Users can register from the sign-in page. New registrations receive the `staff` role; create admin or principal profiles through a trusted administrator process.

6. To remove the demo profile rows from an existing database, run `database/remove-demo-users.sql` in the Supabase SQL Editor.

7. Start local dev server (Vercel emulates serverless functions)

```powershell
npx vercel dev
```

8. Open http://localhost:3000 and the frontend at `/frontend/index.html`.

Troubleshooting:
- If `vercel dev` is not available, install with `npm i -g vercel`.
- Ensure Supabase Auth email confirmation is configured as desired and `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed publicly.
