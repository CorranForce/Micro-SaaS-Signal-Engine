// Scheduling for the /api/cron/agent route is handled by Vercel Cron via
// vercel.json ("crons"), which invokes the route with the CRON_SECRET bearer
// token. The previous in-process node-cron job here did not work on serverless
// (functions are ephemeral) and fetched http://localhost:3000, so it has been
// removed to avoid a duplicate, always-failing hourly call.
//
// If you need a scheduled job in a long-running (non-serverless) self-host,
// call the route with the Authorization: Bearer <CRON_SECRET> header.
export async function register() {
  // no-op
}
