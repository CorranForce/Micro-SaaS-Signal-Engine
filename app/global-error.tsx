"use client";

// App Router global error boundary. This is the ONLY file in this project that
// may legitimately render its own <html>/<body>. It replaces the Pages Router
// pages/_document.tsx pattern — do NOT recreate pages/_document.tsx or import
// from "next/document" anywhere (see BugReport.md, Issue 2).

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#0a0a0a",
          color: "#e5e5e5",
          fontFamily: "sans-serif",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Something went wrong.
        </h2>
        <button
          onClick={() => reset()}
          style={{
            borderRadius: "0.5rem",
            border: "1px solid rgba(255,255,255,0.2)",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
