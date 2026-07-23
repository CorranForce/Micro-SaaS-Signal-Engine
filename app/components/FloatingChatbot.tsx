"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { chatWithAgent } from "../actions";

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "model"; text: string }[]
  >([
    {
      role: "model",
      text: "Hello! I'm your SaaS advisor. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [taskType, setTaskType] = useState<"general" | "complex" | "fast">(
    "general",
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");

    const newMessages = [
      ...messages,
      { role: "user" as const, text: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Map to Gemini history format
      const history = messages.slice(1).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }] as [{ text: string }],
      }));

      const res = await chatWithAgent(history, userMessage, taskType);
      const text =
        res.success && res.data
          ? res.data
          : "Sorry, I encountered an error: " +
            (res.error || "Unknown error. Please try again.");
      setMessages((prev) => [...prev, { role: "model", text }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text:
            "Sorry, I encountered an error: " + (e?.message || "Unknown error"),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-ms-green rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50 text-ms-bg"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-ms-card border border-ms-border rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="bg-ms-bg border-b border-ms-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-ms-green" />
              <h3 className="text-sm font-bold text-white font-ms">
                Signal Engine AI
              </h3>
            </div>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as any)}
              className="bg-ms-card border border-ms-border text-xs text-ms-text-muted rounded px-2 py-1 focus:outline-none"
            >
              <option value="fast">Flash Lite (Fast)</option>
              <option value="general">Flash (General)</option>
              <option value="complex">Pro (High Thinking)</option>
            </select>
          </div>

          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            ref={scrollRef}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === "user"
                      ? "bg-ms-green text-ms-bg font-medium"
                      : "bg-ms-bg border border-ms-border text-ms-text-muted"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-ms-bg border border-ms-border rounded-lg p-3 text-sm text-ms-text-muted flex gap-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-ms-text-muted animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-ms-text-muted animate-bounce delay-75" />
                  <div className="w-2 h-2 rounded-full bg-ms-text-muted animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-ms-border bg-ms-bg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about SaaS ideas..."
                className="flex-1 bg-ms-card border border-ms-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ms-green"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-ms-green text-ms-bg p-2 rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
