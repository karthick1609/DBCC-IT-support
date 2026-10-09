# Run Locally

Prerequisites:
- Node.js 18+ and npm
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
   - `APP_URL` (public app origin used for password recovery links, for example `http://localhost:3000` locally and your HTTPS site origin in production; Vercel deployments can use `VERCEL_URL`)

3. Initialize Supabase schema (run these in Supabase SQL Editor):

- `database/schema.sql`
- `database/seed.sql`
- `database/rls.sql`

4. Create Storage buckets in Supabase: `ticket-attachments`, `asset-images`, `asset-documents`.

5. Users can register from the sign-in page. New registrations receive the `staff` role; create admin or principal profiles through a trusted administrator process.

6. To provision the administrator configured by `ADMIN_EMAIL` and `ADMIN_PASSWORD`, run `npm run provision-admin`. It creates a confirmed Supabase Auth account if one does not exist and assigns its database profile the admin role. If the Auth account already exists, its password is not changed.

7. To remove the demo profile rows from an existing database, run `database/remove-demo-users.sql` in the Supabase SQL Editor.

8. Start the local app server (serves the frontend and runs the API handlers)

```powershell
npm run dev
```

9. Open http://localhost:3000/frontend/login.html.

10. For password recovery, add the `APP_URL/frontend/reset-password.html` URL to Supabase Auth's allowed redirect URLs.

Troubleshooting:
- Ensure port 3000 is available before starting the server.
- Ensure Supabase Auth email confirmation is configured as desired and `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed publicly.
