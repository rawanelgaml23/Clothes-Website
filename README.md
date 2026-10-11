# SALMA Clothes Store

## Run locally

1. Install dependencies with `npm install`.
2. Create a `.env` file from `.env.example` and configure the MySQL connection.
3. Run `npm run backend` in one terminal and `npm run dev` in another.

The local backend creates its database and tables on startup. The Vite development server forwards `/api` requests to `http://localhost:3000`.

## Deploy to Vercel

Vercel deploys the Vite storefront and the API function in `api/[...path].js`. The API requires a reachable MySQL database; Vercel does not run the local Express process or provide a MySQL server.

1. Provision a MySQL database that is reachable from Vercel. Run `backend/schema.sql` against it to create the tables (create the database first if your provider requires it).
2. Add these environment variables in the Vercel project settings for each deployment environment:
   - `DB_HOST`
   - `DB_PORT` (usually `3306`)
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
3. Deploy or redeploy the project.

The API endpoints are `/api/sign-up`, `/api/sign-in`, `/api/orders`, and `/api/health`. `/api/health` should return JSON with `"database": "connected"` when the database is configured correctly.
