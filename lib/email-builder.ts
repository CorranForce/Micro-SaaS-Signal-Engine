const formatMarkdownToHtml = (md: string) => {
  if (!md) return "";
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Format headings: ### Heading
  html = html.replace(/^### (.*?)$/gm, '<h4 style="margin:14px 0 6px;color:#111;font-size:14px;font-family:Verdana,sans-serif">$1</h4>');
  html = html.replace(/^## (.*?)$/gm, '<h3 style="margin:18px 0 8px;color:#111;font-size:15px;font-family:Verdana,sans-serif;border-bottom:1px solid #eee;padding-bottom:4px">$1</h3>');
  html = html.replace(/^# (.*?)$/gm, '<h2 style="margin:22px 0 10px;color:#111;font-size:16px;font-family:Verdana,sans-serif">$1</h2>');
  
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bullet points: - item or * item
  html = html.replace(/^[-\*] (.*?)$/gm, '<div style="display:flex;gap:8px;margin-bottom:4px;font-family:Verdana,sans-serif;font-size:12px;color:#333"><span style="color:#1a7a4a;font-weight:bold">•</span><span>$1</span></div>');
  
  // Inline code: `code`
  html = html.replace(/`(.*?)`/g, '<code style="background:#f5f5f5;padding:2px 4px;font-family:monospace;font-size:11px;border-radius:2px">$1</code>');
  
  // Replace remaining newlines with <br />
  html = html.replace(/\n/g, "<br />");
  
  return html;
};

export const buildEmailHtml = (idea: any, kit: any, roi: any, validationBrief?: string, siftingLog?: string) => {
  const G="#1a7a4a", dark="#1a2e1a", bg="#f8f9fa";
  const section = (title: string, body: string, color=G) =>
    `<div style="margin:0 0 22px;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
      <div style="background:${dark};padding:11px 20px"><strong style="color:${color};font-size:12px;letter-spacing:1px;text-transform:uppercase;font-family:Verdana,sans-serif">${title}</strong></div>
      <div style="padding:16px 20px;font-family:Verdana,sans-serif;font-size:13px;color:#333;line-height:1.7">${body}</div>
    </div>`;
  const row = (k: string, v: string) => v ? `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-family:Verdana,sans-serif;font-size:12px"><span style="color:#666;font-weight:bold">${k}</span><span style="color:#111;font-weight:bold">${v}</span></div>` : "";
  const bullet = (t: string, c=G) => `<div style="display:flex;gap:8px;margin-bottom:5px;font-family:Verdana,sans-serif;font-size:12px;color:#333"><span style="color:${c};font-weight:bold;flex-shrink:0">›</span><span>${t}</span></div>`;

  let h = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:${bg};font-family:Verdana,sans-serif">
<div style="max-width:620px;margin:0 auto;padding:24px 16px">
  <div style="background:${dark};border-radius:8px 8px 0 0;padding:22px 26px;margin-bottom:0">
    <div style="font-size:10px;color:${G};letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;font-family:Verdana,sans-serif">🚀 Micro-SaaS Launch Kit</div>
    <h1 style="margin:0;color:#fff;font-size:22px;font-family:Verdana,sans-serif">${idea.name}</h1>
    <p style="margin:6px 0 0;color:#8acc8a;font-size:13px;font-style:italic;font-family:Verdana,sans-serif">"${idea.tagline||""}"</p>
  </div>
  <div style="background:#e8f5e9;border-left:4px solid ${G};padding:12px 18px;margin-bottom:20px;font-family:Verdana,sans-serif;font-size:13px;color:#2a5a2a">
    <strong>Pain Solved:</strong> ${idea.painSolved||""}<br><strong>Target Customer:</strong> ${idea.targetAudience||""}<br><strong>GTM Channel:</strong> ${idea.gtmChannel||"—"}
  </div>`;

  h += section("📊 ROI Estimate — Lovable.dev Build Costs",
    row("Build Cost (Lovable.dev)",roi.buildCostUSD||"—")+row("Monthly Ops",roi.monthlyExpensesUSD||"—")+
    row("MRR Month 1 (conservative)",roi.realisticMRRMonth1USD||"—")+row("ROI Month 1",roi.roiMonth1Pct||"—")+
    row("Break-even",roi.breakEvenMonths?roi.breakEvenMonths+" months":"—")+
    (roi.assumptions?`<p style="margin:10px 0 0;font-size:11px;color:#888;font-style:italic;font-family:Verdana,sans-serif"><strong>Assumptions:</strong> ${roi.assumptions}</p>`:""),
    "#ffc857");

  if(Array.isArray(idea.pricingTiers) && idea.pricingTiers.length){
    const tH=idea.pricingTiers.map((t: any,i: number)=> {
      if (typeof t === 'string') {
        return `<div style="flex:1;background:#f8f8f8;border:1px solid #ddd;border-radius:5px;padding:14px;text-align:center;min-width:120px">
          <div style="font-size:12px;color:#333;font-weight:bold;font-family:Verdana,sans-serif">${t}</div>
        </div>`;
      }
      return `<div style="flex:1;background:${i===1?"#e8f5e9":"#f8f8f8"};border:${i===1?"2px solid "+G:"1px solid #ddd"};border-radius:5px;padding:14px;text-align:center;min-width:120px">
        ${i===1?`<div style="font-size:9px;color:${G};font-weight:bold;letter-spacing:1px;margin-bottom:3px;font-family:Verdana,sans-serif">★ RECOMMENDED</div>`:""}
        <div style="font-size:12px;color:#333;font-weight:bold;font-family:Verdana,sans-serif">${t.name}</div>
        <div style="font-size:20px;color:${i===1?G:"#333"};font-weight:bold;margin:5px 0;font-family:Verdana,sans-serif">${t.price}</div>
        <div style="font-size:11px;color:#666;font-family:Verdana,sans-serif">${t.description}</div>
      </div>`;
    }).join("");
    h+=section("💰 Pricing Tiers",`<div style="display:flex;gap:10px;flex-wrap:wrap">${tH}</div>`,"#ffc857");
  }

  if(!kit){ h+=`</div></body></html>`; return h; }

  if(kit.lovablePrompt) h+=section("⚡ Lovable.dev Starter Prompt",
    `<div style="background:#fffde7;border:1px solid #f9a825;border-radius:4px;padding:13px;font-family:'Courier New',monospace;font-size:11px;color:#333;line-height:1.8;white-space:pre-wrap">${kit.lovablePrompt}</div>
     <p style="margin:8px 0 0;font-size:11px;color:#888;font-family:Verdana,sans-serif">Paste directly into <a href="https://lovable.dev" style="color:${G}">lovable.dev</a> — no coding needed.</p>`,"#ffc857");

  if(Array.isArray(kit.noCodeStack) && kit.noCodeStack.length) h+=section("🔨 No-Code Stack",
    kit.noCodeStack.map((t: any,i: number)=>{
      if (typeof t === 'string') {
        return `<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid #eee;align-items:flex-start">
          <div style="font-size:12px;color:#333;font-family:Verdana,sans-serif">${t}</div>
        </div>`;
      }
      return `<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid #eee;align-items:flex-start">
        <div style="flex-shrink:0;background:${i===0?"#e8f5e9":"#f0f0f0"};border-radius:3px;padding:3px 9px;font-size:11px;font-weight:bold;color:${i===0?G:"#555"};font-family:Verdana,sans-serif">${t.tool}${i===0?" ⭐":""}</div>
        <div><div style="font-size:12px;font-weight:bold;color:#333;font-family:Verdana,sans-serif">${t.role} <span style="font-weight:normal;color:#888">${t.cost||"free"}</span></div><div style="font-size:11px;color:#666;font-family:Verdana,sans-serif">${t.why}</div></div>
      </div>`;
    }).join(""));

  if(Array.isArray(kit.buildRoadmap) && kit.buildRoadmap.length) h+=section("📅 4-Week Build Roadmap",
    kit.buildRoadmap.map((w: any, idx: number)=>{
      if (typeof w === 'string') {
        return `<div style="margin-bottom:13px"><div style="font-size:13px;color:#333;font-family:Verdana,sans-serif">› ${w}</div></div>`;
      }
      const weekLabel = (w.week && w.week !== 'undefined') ? w.week : `Week ${idx + 1}`;
      const weekTitle = (w.title && w.title !== 'undefined') ? w.title : "";
      return `<div style="margin-bottom:13px">
        <div style="display:flex;gap:10px;align-items:baseline">
          <span style="background:${G};color:#fff;font-size:10px;font-weight:bold;padding:3px 8px;border-radius:3px;font-family:Verdana,sans-serif;white-space:nowrap">${weekLabel}</span>
          ${weekTitle ? `<strong style="font-size:13px;color:#333;font-family:Verdana,sans-serif">${weekTitle}</strong>` : ""}
        </div>
        <div style="margin-top:7px;padding-left:14px">${Array.isArray(w.tasks)?w.tasks.map((t: string)=>bullet(t)).join(""):typeof w.tasks==='string'?bullet(w.tasks):""}</div>
      </div>`;
    }).join(""));

  if(kit.validation){
    const v=kit.validation;
    const sc=parseInt(v.goNoGoScore)>=7?G:parseInt(v.goNoGoScore)>=5?"#f9a825":"#e53935";
    let vH=`<p style="font-family:Verdana,sans-serif;font-size:12px;color:#333;margin:0 0 12px">${v.marketSizeSnapshot||""}</p>`;
    vH+=`<div style="display:flex;justify-content:space-between;align-items:center;background:#f5f5f5;padding:10px 14px;border-radius:4px;margin-bottom:13px">
      <span style="font-family:Verdana,sans-serif;font-size:12px;color:#333">${v.goNoGoReason||""}</span>
      <div style="text-align:center;flex-shrink:0;margin-left:14px"><div style="font-size:10px;color:#888;font-family:Verdana,sans-serif">GO/NO-GO</div><div style="font-size:24px;font-weight:bold;color:${sc};font-family:Verdana,sans-serif">${v.goNoGoScore||"?"}/10</div></div>
    </div>`;
    if(Array.isArray(v.proofOfDemand) && v.proofOfDemand.length) vH+=`<div style="margin-bottom:10px"><strong style="font-size:11px;color:${G};font-family:Verdana,sans-serif">✓ PROOF OF DEMAND</strong><div style="margin-top:5px">${v.proofOfDemand.map((p: any)=>bullet(typeof p==='string'?p:p?.signal||p?.name||JSON.stringify(p),G)).join("")}</div></div>`;
    if(Array.isArray(v.redFlags) && v.redFlags.length)      vH+=`<div style="margin-bottom:10px"><strong style="font-size:11px;color:#e53935;font-family:Verdana,sans-serif">⚠ RED FLAGS</strong><div style="margin-top:5px">${v.redFlags.map((r: any)=>bullet(typeof r==='string'?r:r?.flag||r?.name||JSON.stringify(r),"#e53935")).join("")}</div></div>`;
    if(Array.isArray(v.testScripts) && v.testScripts.length)   vH+=`<div><strong style="font-size:11px;color:#f9a825;font-family:Verdana,sans-serif">💬 INTERVIEW QUESTIONS</strong><div style="margin-top:5px">${v.testScripts.map((q: any,i: number)=>`<div style="background:#fffde7;border-left:3px solid #f9a825;padding:7px 11px;margin-bottom:5px;font-size:12px;color:#333;font-style:italic;font-family:Verdana,sans-serif">${i+1}. "${typeof q==='string'?q:q?.script||q?.name||JSON.stringify(q)}"</div>`).join("")}</div></div>`;
    h+=section("✅ Market Validation",vH);
  }

  if(Array.isArray(kit.presellValidation) && kit.presellValidation.length) h+=section("✋ Pre-Sell Validation Checklist",
    kit.presellValidation.map((s: any,i: number)=>
      `<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #eee;font-family:Verdana,sans-serif;font-size:12px;color:#333">
        <span style="background:#e0e0e0;border-radius:3px;padding:1px 7px;font-size:11px;font-weight:bold;flex-shrink:0">${i+1}</span>${typeof s==='string'?s:s?.name||s?.step||JSON.stringify(s)}
      </div>`).join("")+
    `<p style="margin:9px 0 0;font-size:11px;color:#888;font-style:italic;font-family:Verdana,sans-serif">"Do not write a single line of code until they explicitly agree to pay."</p>`,"#ffc857");

  if(kit.marketingAssets){
    const ma=kit.marketingAssets; let mH="";
    if(ma.landingHeadline)    mH+=`<div style="margin-bottom:13px"><div style="font-size:10px;color:#888;letter-spacing:1px;font-family:Verdana,sans-serif;margin-bottom:3px">HEADLINE</div><div style="font-size:18px;font-weight:bold;color:#111;font-family:Verdana,sans-serif">${ma.landingHeadline}</div></div>`;
    if(ma.landingSubheadline) mH+=`<div style="margin-bottom:13px"><div style="font-size:10px;color:#888;letter-spacing:1px;font-family:Verdana,sans-serif;margin-bottom:3px">SUBHEADLINE</div><div style="font-size:13px;color:#555;font-family:Verdana,sans-serif">${ma.landingSubheadline}</div></div>`;
    if(ma.ctaButton)          mH+=`<div style="margin-bottom:16px"><div style="font-size:10px;color:#888;letter-spacing:1px;font-family:Verdana,sans-serif;margin-bottom:5px">CTA BUTTON</div><span style="background:${G};color:#fff;padding:9px 20px;font-size:13px;font-weight:bold;border-radius:4px;font-family:Verdana,sans-serif">${ma.ctaButton}</span></div>`;
    if(ma.elevatorPitch)      mH+=`<div style="margin-bottom:13px"><strong style="font-size:11px;color:${G};font-family:Verdana,sans-serif">🎤 ELEVATOR PITCH</strong><div style="margin-top:5px;background:#f5f5f5;border-left:3px solid ${G};padding:9px 13px;font-size:13px;color:#333;font-style:italic;font-family:Verdana,sans-serif">"${ma.elevatorPitch}"</div></div>`;
    if(ma.coldEmail)          mH+=`<div style="margin-bottom:13px"><strong style="font-size:11px;color:${G};font-family:Verdana,sans-serif">✉ COLD EMAIL</strong><div style="margin-top:5px;background:#f9f9f9;border:1px solid #ddd;padding:11px;border-radius:4px"><div style="font-size:11px;color:#888;margin-bottom:4px;font-family:Verdana,sans-serif">Subject: <strong style="color:#333">${ma.coldEmail.subject}</strong></div><div style="font-size:12px;color:#333;white-space:pre-line;font-family:Verdana,sans-serif">${ma.coldEmail.body}</div></div></div>`;
    if(ma.socialPost)         mH+=`<div style="margin-bottom:13px"><strong style="font-size:11px;color:#a78bfa;font-family:Verdana,sans-serif">📱 SOCIAL POST</strong><div style="margin-top:5px;background:#f9f0ff;border-left:3px solid #a78bfa;padding:9px 13px;font-size:13px;color:#333;white-space:pre-line;font-family:Verdana,sans-serif">${ma.socialPost}</div></div>`;
    if(ma.socialContentStrategy) mH+=`<div style="margin-bottom:13px"><strong style="font-size:11px;color:#a78bfa;font-family:Verdana,sans-serif">🎯 SOCIAL CONTENT STRATEGY</strong><div style="margin-top:5px;background:#f0f0ff;border-left:3px solid #a78bfa;padding:9px 13px;font-size:13px;color:#333;white-space:pre-line;font-family:Verdana,sans-serif">${ma.socialContentStrategy}</div></div>`;
    if(Array.isArray(ma.blogPostIdeas) && ma.blogPostIdeas.length) mH+=`<div style="margin-bottom:13px"><strong style="font-size:11px;color:${G};font-family:Verdana,sans-serif">✍️ BLOG POST IDEAS</strong><div style="margin-top:5px">${ma.blogPostIdeas.map((idea: string)=>`<div style="background:#e8f5e9;border-left:3px solid ${G};padding:7px 11px;margin-bottom:5px;font-size:12px;color:#333;font-family:Verdana,sans-serif">${idea}</div>`).join("")}</div></div>`;
    if(Array.isArray(ma.objectionHandlers) && ma.objectionHandlers.length) mH+=`<div><strong style="font-size:11px;color:#e53935;font-family:Verdana,sans-serif">🛡 OBJECTION HANDLERS</strong>${ma.objectionHandlers.map((o: any)=>{
      if (typeof o === 'string') {
        return `<div style="background:#fff5f5;border:1px solid #ffcdd2;border-radius:4px;padding:9px 13px;margin-top:7px"><div style="font-size:12px;color:#333;font-family:Verdana,sans-serif">${o}</div></div>`;
      }
      return `<div style="background:#fff5f5;border:1px solid #ffcdd2;border-radius:4px;padding:9px 13px;margin-top:7px"><div style="font-size:12px;color:#e53935;font-weight:bold;margin-bottom:4px;font-family:Verdana,sans-serif">"${o.objection}"</div><div style="font-size:12px;color:#333;font-family:Verdana,sans-serif">→ ${o.response}</div></div>`;
    }).join("")}</div>`;
    h+=section("📣 Marketing Assets",mH);
  }

  if(kit.salesScript){
    const ss=kit.salesScript;
    const entries=[["📞 Cold Call Opener","#1a7a4a",ss.opener],["🔍 Pain Discovery Question","#f9a825",ss.painQuestion],["🎯 The Pitch","#7c3aed",ss.pitch],["🤝 Trial Close","#1a7a4a",ss.trialClose],["✅ The Ask / Close","#e53935",ss.close],["📅 Follow-Up","#888",ss.followUp]].filter(([,,v])=>v);
    let sH=entries.map(([lbl,c,txt])=>
      `<div style="margin-bottom:13px">
        <div style="font-size:10px;color:${c};font-weight:bold;letter-spacing:1px;margin-bottom:5px;font-family:Verdana,sans-serif">${lbl}</div>
        <div style="background:#f9f9f9;border-left:3px solid ${c};padding:9px 13px;font-size:13px;color:#333;font-style:italic;font-family:Verdana,sans-serif">"${txt}"</div>
      </div>`).join("");
    if(Array.isArray(ss.tips) && ss.tips.length) sH+=`<div><strong style="font-size:11px;color:#f9a825;font-family:Verdana,sans-serif">★ PRO TIPS</strong>${ss.tips.map((t: any)=>{
      const label = typeof t === 'string' ? t : t?.tip || t?.name || JSON.stringify(t);
      return `<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid #eee;font-family:Verdana,sans-serif;font-size:12px;color:#333"><span style="color:#f9a825;font-weight:bold">★</span>${label}</div>`;
    }).join("")}</div>`;
    h+=section("📞 Sales Script",sH);
  }

  // AI Validation Brief inclusion
  if (validationBrief) {
    h += section("🤖 AI Market Validation Brief", formatMarkdownToHtml(validationBrief), "#ffc857");
  } else {
    const valPrompt = `Perform a comprehensive market validation for the following B2B micro-SaaS idea:
Name: ${idea.name}
Description: ${idea.description}
Pain Solved: ${idea.painSolved || "N/A"}
Target Audience: ${idea.targetAudience || "N/A"}

Use Google Search to find and incorporate actual customer data, discussions, and video feedback using Google Search, Reddit, and YouTube:
1. Reddit threads and communities (site:reddit.com) discussing this pain point, manual workarounds, or software recommendations.
2. YouTube videos, guides, software walkthroughs, or review channels (site:youtube.com) discussing this challenge, demonstrating existing bad solutions, or suggesting tools.
3. Industry analysis and general Google Search results about the depth of this issue in the legacy line represented.
4. Competitor analysis (who is already doing this, what are their weaknesses).

Based on your findings, provide:
- A summary of Google Search findings.
- An analysis of Reddit community posts and discussions.
- Insights from relevant YouTube videos, software walkthroughs, and tutorial comments.
- A brief competitor analysis.
- A 'go/no-go' validation score (1-10).
- A brief reasoning for the score.

Format the output nicely in Markdown.`;

    h += section("🤖 AI Market Validation Prompt (Not Yet Conducted)", 
      `<p style="margin:0 0 10px;font-size:12px;color:#666;font-style:italic">The AI Validation Brief has not yet been generated in-session. Put this prompt directly into ChatGPT, Gemini, or Claude to complete the validation:</p>
       <div style="background:#f9f9f9;border-left:3px solid #ffc857;padding:12px;font-family:monospace;font-size:11px;color:#444;line-height:1.6;white-space:pre-wrap">${valPrompt}</div>`, 
      "#ffc857"
    );
  }

  // Live Target Sifting Log inclusion
  if (siftingLog) {
    h += section("🔍 Live Target Sifting Log", formatMarkdownToHtml(siftingLog), "#1a7a4a");
  } else {
    const siftPrompt = `Perform deep marketing research using Google Search, Reddit, and YouTube for people complaining about this pain point: "${idea.painSolved || idea.description}" or asking for an app that does "${idea.description}".

You MUST use the Search tool to query and discover source material from:
- Reddit (site:reddit.com): Learn what users complain about, their frustration level, and their current manual hacks.
- YouTube (site:youtube.com): Find software reviews, workflows, tutorial videos, or videos describing the industry process and users' friction.
- General Web Search results: Identify the standard solutions, tools, or lack thereof.

Provide a beautifully formatted Markdown summary of the search results, explicitly categorizing your insights into "Google Search Insights", "Reddit Feedback Logs", and "YouTube Review & Workflow Trends". Prioritize and highlight specific examples of actual customer complaints, software gaps, and validation signs found online. Do not output raw JSON or unformatted text.`;

    h += section("🔍 Live Sifting Prompt (Not Yet Conducted)", 
      `<p style="margin:0 0 10px;font-size:12px;color:#666;font-style:italic">The Live Target Sifting Log has not yet been generated in-session. Put this prompt directly into ChatGPT, Gemini, or Claude to complete the web signal sifting:</p>
       <div style="background:#f9f9f9;border-left:3px solid #1a7a4a;padding:12px;font-family:monospace;font-size:11px;color:#444;line-height:1.6;white-space:pre-wrap">${siftPrompt}</div>`, 
      "#1a7a4a"
    );
  }

  h+=`<div style="text-align:center;padding:18px;color:#aaa;font-size:11px;font-family:Verdana,sans-serif;border-top:1px solid #eee;margin-top:6px">Generated by <strong>Micro-SaaS Signal Engine v5.1 · Maker Edition</strong></div></div></body></html>`;
  return h;
};

export const buildPlainBody = (idea: any, kit: any, roi: any, validationBrief?: string, siftingLog?: string) => {
  const lines=[`LAUNCH KIT: ${idea.name}`,"=".repeat(55),"",`Pain Solved: ${idea.painSolved||""}`,`Target: ${idea.targetAudience||""}`,`GTM: ${idea.gtmChannel||""}`,
    "","─── ROI ───",`Build Cost: ${roi.buildCostUSD||"—"}`,`Monthly Ops: ${roi.monthlyExpensesUSD||"—"}`,`MRR Month 1: ${roi.realisticMRRMonth1USD||"—"}`,`ROI Month 1: ${roi.roiMonth1Pct||"—"}`,`Break-even: ${roi.breakEvenMonths?roi.breakEvenMonths+" months":"—"}`,""];
  if(Array.isArray(idea.pricingTiers) && idea.pricingTiers.length){lines.push("─── PRICING ───");idea.pricingTiers.forEach((t: any)=>{
    if (typeof t === 'string') lines.push(t);
    else lines.push(`${t.name}: ${t.price} — ${t.description}`);
  });lines.push("");}

  if (validationBrief) {
    lines.push("─── AI MARKET VALIDATION BRIEF ───");
    lines.push(validationBrief);
    lines.push("");
  } else {
    lines.push("─── AI MARKET VALIDATION PROMPT (NOT YET CONDUCTED) ───");
    lines.push(`Perform a comprehensive market validation for the following B2B micro-SaaS idea:
Name: ${idea.name}
Description: ${idea.description}
Pain Solved: ${idea.painSolved || "N/A"}
Target Audience: ${idea.targetAudience || "N/A"}

Use Google Search to find and incorporate actual customer data, discussions, and video feedback using Google Search, Reddit, and YouTube:
1. Reddit threads and communities (site:reddit.com) discussing this pain point, manual workarounds, or software recommendations.
2. YouTube videos, guides, software walkthroughs, or review channels (site:youtube.com) discussing this challenge, demonstrating existing bad solutions, or suggesting tools.
3. Industry analysis and general Google Search results about the depth of this issue in the legacy line represented.
4. Competitor analysis (who is already doing this, what are their weaknesses).

Based on your findings, provide:
- A summary of Google Search findings.
- An analysis of Reddit community posts and discussions.
- Insights from relevant YouTube videos, software walkthroughs, and tutorial comments.
- A brief competitor analysis.
- A 'go/no-go' validation score (1-10).
- A brief reasoning for the score.

Format the output nicely in Markdown.`);
    lines.push("");
  }

  if (siftingLog) {
    lines.push("─── LIVE TARGET SIFTING LOG ───");
    lines.push(siftingLog);
    lines.push("");
  } else {
    lines.push("─── LIVE SIFTING PROMPT (NOT YET CONDUCTED) ───");
    lines.push(`Perform deep marketing research using Google Search, Reddit, and YouTube for people complaining about this pain point: "${idea.painSolved || idea.description}" or asking for an app that does "${idea.description}".

You MUST use the Search tool to query and discover source material from:
- Reddit (site:reddit.com): Learn what users complain about, their frustration level, and their current manual hacks.
- YouTube (site:youtube.com): Find software reviews, workflows, tutorial videos, or videos describing the industry process and users' friction.
- General Web Search results: Identify the standard solutions, tools, or lack thereof.

Provide a beautifully formatted Markdown summary of the search results, explicitly categorizing your insights into "Google Search Insights", "Reddit Feedback Logs", and "YouTube Review & Workflow Trends". Prioritize and highlight specific examples of actual customer complaints, software gaps, and validation signs found online. Do not output raw JSON or unformatted text.`);
    lines.push("");
  }

  if(!kit) return lines.join("\n");
  if(kit.lovablePrompt){lines.push("─── LOVABLE.DEV STARTER PROMPT ───");lines.push(kit.lovablePrompt);lines.push("");}
  if(Array.isArray(kit.buildRoadmap) && kit.buildRoadmap.length){lines.push("─── BUILD ROADMAP ───");kit.buildRoadmap.forEach((w: any, idx: number)=>{
    if (typeof w === 'string') { lines.push(`› ${w}`); }
    else {
      const weekLabel = (w.week && w.week !== 'undefined') ? w.week : `Week ${idx + 1}`;
      const weekTitle = (w.title && w.title !== 'undefined') ? w.title : "";
      lines.push(weekTitle ? `${weekLabel}: ${weekTitle}` : weekLabel);
      if (Array.isArray(w.tasks)) w.tasks.forEach((t: string)=>lines.push(`  › ${t}`));
      else if (typeof w.tasks === 'string') lines.push(`  › ${w.tasks}`);
    }
  });lines.push("");}
  if(kit.marketingAssets?.coldEmail){const e=kit.marketingAssets.coldEmail;lines.push("─── COLD EMAIL ───");lines.push(`Subject: ${e.subject}`);lines.push(e.body);lines.push("");}
  if(kit.marketingAssets?.socialContentStrategy){lines.push("─── SOCIAL CONTENT STRATEGY ───");lines.push(kit.marketingAssets.socialContentStrategy);lines.push("");}
  if(Array.isArray(kit.marketingAssets?.blogPostIdeas) && kit.marketingAssets.blogPostIdeas.length){lines.push("─── BLOG POST IDEAS ───");kit.marketingAssets.blogPostIdeas.forEach((idea: string)=>lines.push(`› ${idea}`));lines.push("");}
  if(kit.salesScript){const ss=kit.salesScript;lines.push("─── SALES SCRIPT ───");if(ss.opener)lines.push(`Opener: "${ss.opener}"`);if(ss.close)lines.push(`Close: "${ss.close}"`);lines.push("");}
  lines.push("─".repeat(55));lines.push("Generated by Micro-SaaS Signal Engine v5.1");
  return lines.join("\n");
};
