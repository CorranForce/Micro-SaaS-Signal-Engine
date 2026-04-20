"use server";

export async function checkDomainAction(domain: string, key?: string, secret?: string) {
  const apiKey = key || process.env.GODADDY_API_KEY;
  const apiSecret = secret || process.env.GODADDY_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("GoDaddy API credentials are required. Please check your API Key and Secret in Settings.");
  }

  try {
    const res = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${encodeURIComponent(domain)}`, {
      headers: {
        "Authorization": `sso-key ${apiKey}:${apiSecret}`,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      let errorMessage = e.message || `HTTP ${res.status}`;
      if (res.status === 401) errorMessage = "Unauthorized: Check your GoDaddy API Key and Secret. They might be invalid or expired.";
      if (res.status === 403) errorMessage = "Forbidden: Your GoDaddy API Key does not have permission. Ensure you are using production keys and check IP allowlists.";
      if (res.status === 429) errorMessage = "Rate Limited: GoDaddy API rate limit exceeded. Please try again later.";
      return { error: errorMessage };
    }

    return await res.json();
  } catch (error: any) {
    return { error: `Network error: ${error.message || 'Failed to fetch'}` };
  }
}

export async function testGoDaddyAction(key?: string, secret?: string) {
  const apiKey = key || process.env.GODADDY_API_KEY;
  const apiSecret = secret || process.env.GODADDY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return { error: "GoDaddy API credentials are required. Please check your API Key and Secret in Settings." };
  }

  try {
    const res = await fetch(`https://api.godaddy.com/v1/domains/available?domain=example.guru`, {
      headers: {
        "Authorization": `sso-key ${apiKey}:${apiSecret}`,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      let errorMessage = e.message || `HTTP ${res.status}`;
      if (res.status === 401) errorMessage = "Unauthorized: Check your GoDaddy API Key and Secret. They might be invalid or expired.";
      if (res.status === 403) errorMessage = "Forbidden: Your GoDaddy API Key does not have permission. Ensure you are using production keys and check IP allowlists.";
      if (res.status === 429) errorMessage = "Rate Limited: GoDaddy API rate limit exceeded. Please try again later.";
      return { error: errorMessage };
    }

    return { success: true };
  } catch (error: any) {
    return { error: `Network error: ${error.message || 'Failed to fetch'}` };
  }
}

export async function checkConfigAction() {
  return {
    hasGoDaddy: !!(process.env.GODADDY_API_KEY && process.env.GODADDY_API_SECRET),
    hasResend: !!process.env.RESEND_API_KEY
  };
}

export async function sendEmailAction(toEmail: string, subject: string, html: string, key?: string) {
  const apiKey = key || process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Resend API key is required. Please check your API Key in Settings.");
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Launch Kit <onboarding@resend.dev>",
        to: [toEmail],
        subject,
        html
      }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      let errorMessage = e.message || `HTTP ${res.status}`;
      if (res.status === 401) errorMessage = "Unauthorized: Check your Resend API Key. It might be invalid or expired.";
      if (res.status === 403) errorMessage = "Forbidden: Verify your domain with Resend, or ensure you are sending to an allowed email address if using a sandbox domain.";
      if (res.status === 429) errorMessage = "Rate Limited: Resend API rate limit exceeded. Please try again later.";
      return { error: errorMessage };
    }

    return await res.json();
  } catch (error: any) {
    return { error: `Network error: ${error.message || 'Failed to fetch'}` };
  }
}
