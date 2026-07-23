"use client";

import { useState, useEffect } from "react";

export function TypewriterLog({ text, color }: { text: string; color: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 15);

    return () => clearInterval(typingInterval);
  }, [text]);

  return (
    <div className={`${color} leading-relaxed`}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-1.5 h-3 bg-current ml-1 animate-pulse align-middle" />
      )}
    </div>
  );
}
