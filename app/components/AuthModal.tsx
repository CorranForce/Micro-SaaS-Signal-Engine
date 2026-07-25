"use client";

import type { FormEvent } from "react";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";

interface AuthModalProps {
  isRegister: boolean;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  onToggleMode: () => void;
}

export function AuthModal({
  isRegister,
  email,
  setEmail,
  password,
  setPassword,
  error,
  success,
  isSubmitting,
  onSubmit,
  onClose,
  onToggleMode,
}: AuthModalProps) {
  return (
    <div className="fixed inset-0 bg-ms-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-ms-card border border-ms-border w-full max-w-sm rounded-lg overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-3">
          <button
            onClick={onClose}
            className="text-ms-text-muted hover:text-white text-xs font-ms p-1 transition-colors"
          >
            [✕] CLOSE
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-ms-green-dark border border-ms-green rounded flex items-center justify-center font-ms text-ms-green text-lg font-bold mx-auto mb-2">
              🔐
            </div>
            <h3 className="text-base font-bold text-white font-ms">
              {isRegister ? "REGISTER TERMINAL" : "AUTHENTICATE SESSION"}
            </h3>
            <p className="text-[10px] text-ms-text-muted mt-1 font-ms">
              {isRegister
                ? "Create a new local operator credential"
                : "Verify operator code-keys to launch system"}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded font-ms flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-ms-green/10 border border-ms-green/20 text-ms-green text-xs rounded font-ms flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-ms-green" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-[9px] font-ms text-ms-text-muted uppercase mb-1">
                Email Terminal Address
              </label>
              <input
                type="email"
                required
                placeholder="operator@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ms-bg border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green font-ms font-sans"
              />
            </div>
            <div>
              <label className="block text-[9px] font-ms text-ms-text-muted uppercase mb-1">
                Secret Access Cipher
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ms-bg border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green font-ms font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-ms-green hover:bg-[#00d066] text-ms-bg font-bold text-xs rounded transition-all font-ms flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-ms-bg border-t-transparent animate-spin"></div>
                  PROCESSING...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  {isRegister ? "PROVISION USER" : "VERIFY SECURITY"}
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-ms-border">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-[10px] text-ms-green hover:underline font-ms"
            >
              {isRegister
                ? "Already configured? Verify security cipher"
                : "Need to establish terminal? Provision user"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
