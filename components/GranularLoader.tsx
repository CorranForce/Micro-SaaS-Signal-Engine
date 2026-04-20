"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface GranularLoaderProps {
  messages: string[];
  intervalMs?: number;
  className?: string;
}

export function GranularLoader({ messages, intervalMs = 2000, className = "" }: GranularLoaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, messages.length - 1));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [messages.length, intervalMs]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.span 
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="inline-block text-ms-green"
      >
        ⟳
      </motion.span>
      <div className="relative h-5 overflow-hidden flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center text-ms-green font-bold text-[13px]"
          >
            {messages[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
