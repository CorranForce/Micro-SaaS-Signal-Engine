"use client";

import { useState, useEffect } from "react";
import { SL } from "./SharedUI";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

const GENERIC_PRESELL = [
  "Identified 3+ specific businesses to contact",
  "Described the problem back to a real owner",
  "Got verbal confirmation the problem costs them money",
  "Quoted a price — they didn't immediately say no",
  "Received written or verbal commitment to pay before building",
];

interface ChecklistItem {
  id: string;
  text: string;
}

const getValidationScriptAndLocation = (text: string, ideaName: string) => {
  const t = (text || "").toLowerCase();
  const name = ideaName || "this micro-SaaS solution";
  
  if (t.includes("identify") || t.includes("list") || t.includes("find") || t.includes("prospect") || t.includes("business")) {
    return {
      category: "📡 Target Sifting & Finding",
      where: [
        "LinkedIn Search: Look up Title ('Owner', 'Operations Leader', 'VP') in your target sector (e.g. logistics, agency). Filter by company size: 1-10 or 11-50.",
        "Google Maps: Zoom in on key metro areas, search for regional services/retailers, and compile their domains.",
        "Apollo.io / Hunter.io: Sign up for a free tier to extract direct B2B corporate emails.",
        "Industry Directories: Check niche directories, Clutch.co listings, or local chamber of commerce sheets."
      ],
      script: `Hi [Prospect Name],

I hope your week is off to a great start. I'm researching operational bottlenecks in the B2B space—specifically regarding how owners manage workflows around ${name}.

I'm not selling anything today; just wrapping up a brief 5-minute research sprint. 

Would you be open to giving some expert feedback on a 5-minute phone call next Tuesday? I would appreciate your insights.

Best,
[Your Name]`
    };
  }
  
  if (t.includes("contact") || t.includes("email") || t.includes("reach") || t.includes("message") || t.includes("reddit") || t.includes("forum")) {
    return {
      category: "✉️ Channel Outreach & Inquiries",
      where: [
        "Cold Email: Send direct highly personalized business emails using a clean domain.",
        "LinkedIn Connection: Connect with a personalized note first, then follow up.",
        "Industry Forums: Search Reddit (e.g. r/smallbusiness, r/construction) or specific Facebook groups where founders discuss daily operations."
      ],
      script: `Subject: Quick question about [specific bottleneck/process] at [Company Name]?

Hi [Prospect Name],

My name is [Your Name] and I've been following [Company Name]'s growth. 

I'm currently validating a simple tool specifically designed for B2B operators to streamline ${name}. In talking to others in your industry, a common headache is the hours wasted on manual tracking and data reconciliation.

Is this manual bottleneck something that currently affects your team's velocity? 

Would appreciate your quick take.

Best,
[Your Name]`
    };
  }

  if (t.includes("describe") || t.includes("problem") || t.includes("interview") || t.includes("explore") || t.includes("confirm")) {
    return {
      category: "🔬 The Mom Test Interview",
      where: [
        "Zoom / Google Meet: Record a quick 10-minute feedback chat.",
        "Phone Call: Keep it casual. Don't frame it as a 'pitch'; frame it as seeking domain-expert perspective."
      ],
      script: `Focus on their past and current actions, not future promises. Ask these questions:

1. "How do you currently handle the day-to-day work of [specific challenge]?"
2. "What's the absolute hardest part about that process?"
3. "Are you currently paying for any tools, spreadsheets, or systems to solve this?"
4. "What did you hate most about the solutions you tried in the past?"
5. "How often does this bottleneck arise, and who on your team handles it?"`
    };
  }

  if (t.includes("quote") || t.includes("price") || t.includes("charge") || t.includes("pricing") || t.includes("cost") || t.includes("tier")) {
    return {
      category: "💵 Pricing Fit & Budget Validation",
      where: [
        "Natural transition during your feedback call once the prospect confirms the pain point.",
        "Follow-up email summary after they help you detail their ideal workflow."
      ],
      script: `Hi [Prospect Name],

Based on our chat about how manual overhead is costing your team several hours of friction, we're building a lightweight B2B service called ${name} to fully automate this workflow.

We're accepting just 3 founding pilot partners for next month's launch. Since you helped us outline the core specs, we want to offer you a lifetime subscription at only $99/month (normally $199/month).

Is this a cost you'd be ready to allocate budget for to automate this problem away?`
    };
  }

  if (t.includes("commitment") || t.includes("order") || t.includes("deposit") || t.includes("pay") || t.includes("payment") || t.includes("subscribe") || t.includes("buy")) {
    return {
      category: "🤝 Pre-Launch Commitment & Deposits",
      where: [
        "Stripe Payment Links: Create a test or live product in Stripe and send a direct payment URL.",
        "Letter of Intent (LOI): Send a non-binding PDF stating they plan to try the tool upon release."
      ],
      script: `Hi [Prospect Name],

To reserve your custom workspace slot in next month's pilot release of ${name} (and guarantee your grandfathered lifetime rate of $99/mo), we're asking our partners for a fully refundable $50 pre-order deposit.

This ensures we prioritize configuring your specific legacy templates and formats before onboarding other users. If we don't save you hours of work inside your first 30 days, we'll refund it immediately.

You can secure your spot on our launch manifest here: [Stripe Link]

Excited to build this for you.

Best,
[Your Name]`
    };
  }

  return {
    category: "💡 Operational Validation Tactics",
    where: [
      "LinkedIn: Search the niche job titles and reach out dynamically.",
      "Reddit: Join relevant interest groups (e.g. B2B, legacy niches).",
      "Local Businesses: Call or visit nearby locations to ask about their digital solutions."
    ],
    script: `Hi [Prospect Name],

I'm validating a lightweight micro-services project specifically answering hurdles in B2B systems.

No sales pitch—I'm trying to learn about actual day-to-day hassles operators suffer with ${name}. Would you be up for a 2-minute chat?

Thanks,
[Your Name]`
  };
};

export const PreSellChecklist = ({ steps, ideaName }: { steps?: any[]; ideaName?: string }) => {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [newStepText, setNewStepText] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const normalizedIdeaName = ideaName || "default-idea";
  const stepsStorageKey = `ms-validation-steps-${normalizedIdeaName}`;
  const ticksStorageKey = `ms-validation-ticks-${normalizedIdeaName}`;

  // First effect for mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state with localStorage after mounting, or when ideaName changes
  useEffect(() => {
    if (!mounted) return;

    // Load custom steps or fall back to default steps
    const savedSteps = localStorage.getItem(stepsStorageKey);
    let loadedItems: ChecklistItem[] = [];

    if (savedSteps) {
      try {
        loadedItems = JSON.parse(savedSteps);
      } catch (e) {
        console.error("Error parsing saved checklist steps:", e);
      }
    }

    if (loadedItems.length === 0) {
      // Use provided steps prop or fallback to generic
      const initialSteps = (steps && steps.length > 0) ? steps : GENERIC_PRESELL;
      loadedItems = initialSteps.map((s, idx) => {
        const text = typeof s === "string" ? s : s?.name || s?.step || JSON.stringify(s);
        return {
          id: `default-${idx}`,
          text,
        };
      });
    }

    setItems(loadedItems);

    // Load ticks
    const savedTicks = localStorage.getItem(ticksStorageKey);
    if (savedTicks) {
      try {
        setChecks(JSON.parse(savedTicks));
      } catch (e) {
        console.error("Error parsing saved checklist checks:", e);
        setChecks({});
      }
    } else {
      setChecks({});
    }
  }, [mounted, normalizedIdeaName, stepsStorageKey, ticksStorageKey, steps]);

  // Save changes to localStorage
  const saveTicks = (updatedChecks: Record<string, boolean>) => {
    setChecks(updatedChecks);
    if (mounted) {
      localStorage.setItem(ticksStorageKey, JSON.stringify(updatedChecks));
    }
  };

  const saveSteps = (updatedItems: ChecklistItem[]) => {
    setItems(updatedItems);
    if (mounted) {
      localStorage.setItem(stepsStorageKey, JSON.stringify(updatedItems));
    }
  };

  const handleToggle = (itemId: string) => {
    const updated = { ...checks, [itemId]: !checks[itemId] };
    saveTicks(updated);
    if (updated[itemId]) {
      toast.success("Step verified!");
    }
  };

  const handleAddCustomStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim()) return;

    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: newStepText.trim(),
    };

    const updated = [...items, newItem];
    saveSteps(updated);
    setNewStepText("");
    setShowAddCustom(false);
    toast.success("Additional verification step added!");
  };

  const handleRemoveStep = (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = items.filter(item => item.id !== itemId);
    saveSteps(updated);
    
    const updatedChecks = { ...checks };
    delete updatedChecks[itemId];
    saveTicks(updatedChecks);
    toast.success("Step removed.");
  };

  const handleResetChecklist = () => {
    const defaultSteps = (steps && steps.length > 0) ? steps : GENERIC_PRESELL;
    const loadedItems = defaultSteps.map((s, idx) => {
      const text = typeof s === "string" ? s : s?.name || s?.step || JSON.stringify(s);
      return {
        id: `default-${idx}`,
        text,
      };
    });
    
    setChecks({});
    setItems(loadedItems);
    
    if (mounted) {
      localStorage.removeItem(stepsStorageKey);
      localStorage.removeItem(ticksStorageKey);
    }
    toast.success("Checklist reset to defaults.");
  };

  if (!mounted) {
    // Return a beautiful skeleton or loading placeholder during SSR
    return (
      <div className="bg-ms-panel border border-ms-border border-l-4 border-l-ms-yellow px-4 py-3.5 animate-pulse">
        <div className="h-4 bg-ms-border/30 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-ms-border/20 rounded w-full"></div>
          <div className="h-3 bg-ms-border/20 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const verifiedCount = items.filter(item => checks[item.id]).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
  const allDone = verifiedCount === totalCount && totalCount > 0;

  return (
    <div className="bg-ms-panel border border-ms-border border-l-4 border-l-ms-yellow px-4 py-3.5 relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px]">✋</span>
          <SL color="#ffc857">Validation Checklist</SL>
          {ideaName && (
            <span className="text-[10px] text-ms-text-muted font-mono bg-ms-panel-light border border-ms-border px-1.5 py-0.5 rounded truncate max-w-[120px] sm:max-w-[180px]">
              {ideaName}
            </span>
          )}
        </div>
        <span className={`font-ms text-[10px] font-bold shrink-0 ${allDone ? "text-ms-green animate-bounce" : "text-ms-yellow"}`}>
          {verifiedCount}/{totalCount} {allDone ? "✓ READY TO LAUNCH" : "— Validate First!"}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-[10px] text-ms-text-muted font-mono mb-1">
          <span>Verification Progress</span>
          <span className={allDone ? "text-ms-green font-bold" : "text-ms-yellow"}>{progressPercent}%</span>
        </div>
        <div className="w-full bg-ms-bg/80 border border-ms-border/60 h-2 rounded-full overflow-hidden p-[1px]">
          <motion.div 
            className={`h-full rounded-full ${allDone ? "bg-ms-green" : "bg-ms-yellow"}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="space-y-2.5 mb-4 max-h-[450px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const isChecked = !!checks[item.id];
            const isExpanded = expandedId === item.id;
            const details = getValidationScriptAndLocation(item.text, normalizedIdeaName);
            
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="border border-ms-border/20 hover:border-ms-border bg-ms-bg/20 p-2 rounded-sm transition-all"
              >
                {/* Header Row */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex gap-2.5 cursor-pointer items-start justify-between group"
                >
                  <div className="flex gap-2.5 items-start flex-1 min-w-0">
                    {/* Checkbox */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(item.id);
                      }}
                      className={`w-[17px] h-[17px] shrink-0 mt-[1.5px] border-2 flex items-center justify-center transition-all ${isChecked ? "border-ms-green bg-ms-green-dark" : "border-ms-border-light bg-transparent hover:border-ms-yellow/60"}`}
                    >
                      {isChecked && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-ms-green text-[10px] font-bold"
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>

                    <span className={`font-ms text-[11.5px] leading-[1.5] transition-all flex-1 min-w-0 ${isChecked ? "text-ms-text-muted line-through" : "text-ms-text-light no-underline font-medium group-hover:text-white"}`}>
                      {item.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {/* Expand indicator label */}
                    <span className="font-ms text-[9px] text-ms-text-muted group-hover:text-ms-yellow transition-all uppercase tracking-tight hidden sm:inline">
                      {isExpanded ? "Hide Script" : "View Script 💬"}
                    </span>
                    
                    <span className={`text-[10px] text-ms-text-muted transition-transform duration-200 ${isExpanded ? "rotate-180 text-ms-yellow" : "rotate-0"}`}>
                      ▼
                    </span>

                    {item.id.startsWith("custom-") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStep(item.id, e);
                        }}
                        className="text-[9px] text-ms-text-muted hover:text-red-400 p-0.5 font-mono ml-1"
                        title="Delete step"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-ms-border/30 mt-2 pt-2.5 space-y-3 font-ms text-[11px]"
                    >
                      {/* Badge category */}
                      <div className="flex justify-between items-center bg-[#182818]/50 border border-ms-green/20 px-2 py-1 rounded-sm">
                        <span className="font-bold text-ms-green text-[9px] tracking-wider uppercase font-mono font-normal">
                          {details.category}
                        </span>
                        <span className="text-ms-text-muted text-[9.5px]">Validation Intel</span>
                      </div>

                      {/* Where to find potential clients */}
                      <div className="bg-ms-panel/50 border border-ms-border/30 p-2.5 rounded-sm">
                        <div className="text-ms-white font-bold mb-1.5 flex items-center gap-1.5">
                          <span className="text-ms-green">📡</span>
                          <span>Where to find potential customers?</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-ms-text-muted leading-relaxed">
                          {details.where.map((loc, idx) => (
                            <li key={idx} className="marker:text-ms-green">
                              {loc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Outreach script */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-ms-white font-bold px-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-ms-yellow">💬</span>
                            <span>Example Outreach Script</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(details.script);
                              toast.success("Script copied to clipboard!");
                            }}
                            className="bg-ms-panel-light hover:bg-ms-panel border border-ms-border text-ms-green hover:text-white px-2 py-0.5 text-[9px] font-mono font-bold cursor-pointer transition-all uppercase rounded-sm flex items-center gap-1"
                          >
                            <span>📋</span> Copy Script
                          </button>
                        </div>
                        <pre className="p-3 bg-ms-bg font-mono border border-ms-border/40 text-[10px] text-ms-text-light whitespace-pre-wrap break-words leading-relaxed select-text shadow-inner max-h-[170px] overflow-y-auto">
                          {details.script}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Expandable Add Custom Form */}
      <div className="flex gap-2 items-center border-t border-ms-border/40 pt-3 mt-3">
        {showAddCustom ? (
          <form onSubmit={handleAddCustomStep} className="w-full flex gap-1.5">
            <input
              type="text"
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="e.g. Email 10 prospects for calls..."
              className="flex-1 bg-ms-bg border border-ms-border px-2.5 py-1 text-xs text-white font-ms focus:outline-none focus:border-ms-yellow/85 placeholder-ms-text-muted/65 rounded-sm"
              maxLength={120}
              autoFocus
            />
            <button
              type="submit"
              className="bg-ms-yellow border border-ms-yellow-dark text-ms-bg px-2.5 py-1 text-[10px] font-bold cursor-pointer hover:bg-ms-yellow-dark hover:text-white transition-colors uppercase"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="border border-ms-border text-ms-text-muted px-2.5 py-1 text-[10px] font-bold cursor-pointer hover:bg-ms-panel-light hover:text-white transition-colors uppercase"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex justify-between items-center w-full">
            <button
              onClick={() => setShowAddCustom(true)}
              className="font-ms text-[10px] text-ms-yellow hover:text-ms-yellow-light hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <span>+ Add custom validation step</span>
            </button>
            
            <button
              onClick={handleResetChecklist}
              className="font-ms text-[10px] text-ms-text-muted hover:text-white hover:underline uppercase tracking-wider"
              title="Reset checklist items and state"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {!allDone && totalCount > 0 && (
        <div className="mt-3 font-ms text-[10px] text-ms-text-muted italic border-t border-ms-border/20 pt-2">
          &quot;Do not write a single line of code until you verbalize and validate their problem.&quot;
        </div>
      )}
    </div>
  );
};
