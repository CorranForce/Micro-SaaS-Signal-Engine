// Optional in-process scheduler for the hourly security agent.
//
// Production scheduling is handled by Vercel Cron (see vercel.json), so this is
// OFF by default: running both double-fires the job, and on serverless the
// node-cron timer dies with the lambda anyway. Set ENABLE_LOCAL_CRON=true to run
// it in a long-lived local/self-hosted process.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.ENABLE_LOCAL_CRON !== "true") return;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn(
      "⚠️ ENABLE_LOCAL_CRON is set but CRON_SECRET is not — the agent route would reject every call. Skipping.",
    );
    return;
  }

  const globalScope = globalThis as typeof globalThis & {
    __cron_started?: boolean;
  };
  if (globalScope.__cron_started) return;
  globalScope.__cron_started = true;

  const cron = await import("node-cron");

  // Honour the port the server was actually started on (package.json uses 3000,
  // but `next dev -p` / PORT can move it; a hard-coded 3000 silently no-ops).
  const port = process.env.PORT || "3000";
  const agentUrl =
    process.env.CRON_AGENT_URL || `http://127.0.0.1:${port}/api/cron/agent`;

  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Running hourly security agent...");
    try {
      const res = await fetch(agentUrl, {
        headers: { Authorization: `Bearer ${cronSecret}` },
      });
      if (!res.ok) {
        console.warn(`⚠️ Agent cron returned status ${res.status}`);
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        console.log("✅ Agent Report Generated:", data.report);
      } else {
        console.warn("⚠️ Agent cron response was not JSON");
      }
    } catch (err) {
      console.error("❌ Agent cron failed:", err);
    }
  });

  console.log(`⚙️ Hourly security agent cron registered (${agentUrl}).`);
}
