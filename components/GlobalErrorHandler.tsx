"use client";

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      const message = event.reason?.message || (typeof event.reason === 'string' ? event.reason : "An unexpected network or API error occurred.");
      toast.error(`Error: ${message}`);
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
      const message = event.error?.message || event.message || "An unexpected error occurred.";
      toast.error(`Error: ${message}`);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
