"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ms-bg text-ms-text p-8 flex flex-col items-center justify-center font-ms">
          <div className="bg-ms-panel border border-ms-red p-6 max-w-2xl w-full">
            <h2 className="text-ms-red font-bold text-xl mb-4">Something went wrong</h2>
            <div className="bg-ms-bg border border-ms-border p-4 overflow-auto max-h-96 text-sm text-ms-text-muted">
              {this.state.error?.message || "Unknown error occurred"}
            </div>
            <button
              className="mt-4 bg-ms-red text-white px-4 py-2 text-sm font-bold hover:bg-ms-red-dark transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
