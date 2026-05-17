"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ProgressStepsProps {
  steps: string[];
  isComplete: boolean;
  intervalMs?: number;
}

export function ProgressSteps({ steps, isComplete, intervalMs = 2500 }: ProgressStepsProps) {
  const [completedIndex, setCompletedIndex] = useState(-1);

  useEffect(() => {
    if (isComplete) {
      setCompletedIndex(steps.length - 1);
      return;
    }

    const interval = setInterval(() => {
      setCompletedIndex((prev) => {
        if (prev < steps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [steps.length, intervalMs, isComplete]);

  return (
    <div className="space-y-2.5">
      {steps.map((step, index) => {
        const isFinished = isComplete || index <= completedIndex;
        const isCurrent = !isComplete && index === completedIndex + 1;
        
        return (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-5 h-5 flex items-center justify-center border text-[10px] font-bold relative ${
              isFinished ? "bg-ms-green border-ms-green text-ms-bg" : 
              isCurrent ? "bg-ms-bg border-ms-green text-ms-green" : 
              "bg-ms-bg border-ms-border text-ms-text-muted"
            }`}>
              {isFinished ? "✓" : isCurrent ? "⟳" : index + 1}
              {isCurrent && (
                <>
                  <motion.div 
                    className="absolute inset-0 border-2 border-ms-green rounded-sm"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [1, 0, 1] 
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div 
                    className="absolute inset-0 bg-ms-green/20"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </>
              )}
            </div>
            <span className={`font-ms text-[12px] ${
              isFinished ? "text-ms-green font-bold" : 
              isCurrent ? "text-white" : 
              "text-ms-text-muted"
            }`}>
              {step}
              {isCurrent && (
                <motion.span 
                  animate={{ opacity: [1, 0] }} 
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="ml-1"
                >
                  _
                </motion.span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
