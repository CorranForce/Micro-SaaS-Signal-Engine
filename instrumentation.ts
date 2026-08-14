export async function register() {
  // This in-process scheduler exists for LOCAL dev only:
  //  - On Vercel the same job is already scheduled by vercel.json ("crons"),
  //    so running it here too would double-invoke the agent.
  //  - Serverless instances are short-lived and there is no server on
  //    localhost:3000, so the fetch below would just log errors forever.
  // It is also skipped during `next build`, where route modules are imported
  // for page-data collection and no server is listening.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isManagedHost = Boolean(process.env.VERCEL);

  if (process.env.NEXT_RUNTIME === 'nodejs' && !isBuildPhase && !isManagedHost) {
    const cron = await import('node-cron');

    // The route requires Authorization: Bearer $CRON_SECRET and fails closed
    // without it, so there is nothing to schedule when it is unset.
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.log(
        'ℹ️ CRON_SECRET is unset — skipping the local hourly security agent.',
      );
      return;
    }

    if (!(global as any).__cron_started) {
      (global as any).__cron_started = true;

      const port = process.env.PORT || '3000';
      const agentUrl = `http://localhost:${port}/api/cron/agent`;

      // Schedule task to run at the top of every hour (0 * * * *)
      cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running hourly security agent...');
        try {
          const res = await fetch(agentUrl, {
            headers: { Authorization: `Bearer ${cronSecret}` },
          });
          if (!res.ok) {
            console.warn(`⚠️ Agent cron returned status ${res.status}`);
            return;
          }
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            console.log('✅ Agent Report Generated:', data.report);
          } else {
            console.warn('⚠️ Agent cron response was not JSON');
          }
        } catch (err) {
          console.error('❌ Agent cron failed:', err);
        }
      });

      console.log('⚙️ Hourly security agent cron registered (local dev).');
    }
  }
}
