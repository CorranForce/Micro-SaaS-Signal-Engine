export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');

    if (!(global as any).__cron_started) {
      (global as any).__cron_started = true;
      
      // Schedule task to run at the top of every hour (0 * * * *)
      cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running hourly security agent...');
        try {
          const res = await fetch('http://localhost:3000/api/cron/agent');
          const data = await res.json();
          console.log('✅ Agent Report Generated:', data.report);
        } catch (err) {
          console.error('❌ Agent cron failed:', err);
        }
      });
      
      console.log('⚙️ Hourly security agent cron registered.');
    }
  }
}
