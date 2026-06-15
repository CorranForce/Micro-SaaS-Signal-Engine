"use client";

export interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitErrors: number;
  estimatedTokens: number;
  lastActive: string | null;
  status: "idle" | "connected" | "rate_limited" | "invalid_key" | "failed";
  lastErrorMessage: string | null;
}

const DEFAULT_STATS: ApiUsageStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  rateLimitErrors: 0,
  estimatedTokens: 0,
  lastActive: null,
  status: "idle",
  lastErrorMessage: null,
};

const STORAGE_KEY = "ms-api-usage-stats";

export const apiTracker = {
  getStats(): ApiUsageStats {
    if (typeof window === "undefined") return DEFAULT_STATS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATS));
        return DEFAULT_STATS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse API stats in localStorage:", e);
      return DEFAULT_STATS;
    }
  },

  setStats(stats: ApiUsageStats) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      // Dispatch a storage event so other components on settings page can listen & update
      window.dispatchEvent(new Event("api-stats-updated"));
    } catch (e) {
      console.error("Failed to write API stats to localStorage:", e);
    }
  },

  logAttempt() {
    const stats = this.getStats();
    stats.totalRequests += 1;
    this.setStats(stats);
  },

  logSuccess(promptText: string = "", responseText: string = "") {
    const stats = this.getStats();
    stats.successfulRequests += 1;
    stats.status = "connected";
    stats.lastActive = new Date().toISOString();
    stats.lastErrorMessage = null;

    // Standard approximation: 1 token is approx 4 characters in English
    const estimatedPromptTokens = Math.ceil(promptText.length / 4);
    const estimatedResponseTokens = Math.ceil(responseText.length / 4);
    stats.estimatedTokens += (estimatedPromptTokens + estimatedResponseTokens);

    this.setStats(stats);
  },

  logFailure(error: any) {
    const stats = this.getStats();
    stats.failedRequests += 1;
    stats.lastActive = new Date().toISOString();

    const errMsg = error?.message || String(error || "Unknown Error");
    stats.lastErrorMessage = errMsg;

    const lower = errMsg.toLowerCase();
    if (lower.includes("429") || lower.includes("rate limit") || lower.includes("quota") || lower.includes("resource_exhausted")) {
      stats.rateLimitErrors += 1;
      stats.status = "rate_limited";
    } else if (lower.includes("invalid") || lower.includes("api key") || lower.includes("api_key_invalid")) {
      stats.status = "invalid_key";
    } else {
      stats.status = "failed";
    }

    this.setStats(stats);
  },

  resetStats() {
    this.setStats(DEFAULT_STATS);
  }
};
