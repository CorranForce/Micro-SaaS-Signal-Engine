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

export const PreSellChecklist = ({ steps, ideaName }: { steps?: any[]; ideaName?: string }) => {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [newStepText, setNewStepText] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);

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

      <div className="space-y-2 mb-4 max-h-[250px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const isChecked = !!checks[item.id];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleToggle(item.id)}
                className="group flex gap-2.5 cursor-pointer items-start hover:bg-ms-panel-light/30 p-1 rounded-sm transition-all"
              >
                <div className={`w-[17px] h-[17px] shrink-0 mt-[1px] border-2 flex items-center justify-center transition-all ${isChecked ? "border-ms-green bg-ms-green-dark" : "border-ms-border-light bg-transparent group-hover:border-ms-yellow/60"}`}>
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
                
                <div className="flex-1 flex justify-between items-start gap-2">
                  <span className={`font-ms text-[11px] leading-[1.5] transition-all ${isChecked ? "text-ms-text-muted line-through" : "text-ms-text-light no-underline"}`}>
                    {item.text}
                  </span>
                  
                  {item.id.startsWith("custom-") && (
                    <button
                      onClick={(e) => handleRemoveStep(item.id, e)}
                      className="text-[9px] text-ms-text-muted hover:text-red-400 p-0.5 font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete step"
                    >
                      ✕
                    </button>
                  )}
                </div>
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
