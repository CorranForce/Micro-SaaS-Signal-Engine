"use client";

// App Router replacement for pages/_document.tsx-level error handling.
// This is the only file that should ever render its own <html>/<body> tags.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#0a0a0f",
          color: "#e4e4e7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Something went wrong</h1>
        <p style={{ opacity: 0.7, margin: 0 }}>
          {error.digest ? `Error reference: ${error.digest}` : "An unexpected error occurred."}
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(255,255,255,0.2)",
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
