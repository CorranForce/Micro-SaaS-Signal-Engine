"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  Wrench,
  Database,
  Mail,
  Globe,
  Check,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// Shape of the client-side settings form state (a superset of the persisted
// credentials plus UI preferences). Exported so page.tsx can type its useState
// with the exact same shape.
export interface ApiSettingsState {
  supabaseUrl: string;
  supabaseAnonKey: string;
  resendApiKey: string;
  godaddyApiKey: string;
  godaddyApiSecret: string;
  compactMode: boolean;
  fontFamily: string;
  fontSize: string;
}

interface SettingsPanelProps {
  isOperator: boolean;
  currentUser: string | null;
  apiSettings: ApiSettingsState;
  setApiSettings: Dispatch<SetStateAction<ApiSettingsState>>;
  settingsMessage: { type: "success" | "error"; text: string } | null;
  isLoadingSettings: boolean;
  isSavingSettings: boolean;
  onSave: (e: FormEvent) => void;
  onBack: () => void;
}

export function SettingsPanel({
  isOperator,
  currentUser,
  apiSettings,
  setApiSettings,
  settingsMessage,
  isLoadingSettings,
  isSavingSettings,
  onSave,
  onBack,
}: SettingsPanelProps) {
  if (!isOperator) {
    return (
      <div className="bg-ms-card border border-red-900/30 p-8 rounded-lg max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 bg-red-950/50 border border-red-500 rounded-full flex items-center justify-center text-red-400 mx-auto text-xl">
          ⚠️
        </div>
        <h2 className="text-base font-bold text-white">Access Denied</h2>
        <p className="text-xs text-ms-text-muted leading-relaxed">
          This API Settings page is strictly restricted to administrator
          credentials. Your account (
          <strong className="text-red-400">{currentUser || "Anonymous"}</strong>
          ) is not authorized.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-ms-card border border-ms-border hover:border-ms-text-muted text-xs font-ms rounded text-white transition-all"
        >
          RETURN TO RADAR
        </button>
      </div>
    );
  }

  return (
    <div className="bg-ms-card border border-ms-border p-8 rounded-lg max-w-2xl mx-auto space-y-6">
      <div className="border-b border-ms-border pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="text-ms-green w-5 h-5" />
            API Credentials & Settings
          </h2>
          <p className="text-xs text-ms-text-muted mt-1">
            Configure integrations for Supabase, Resend, and GoDaddy APIs.
          </p>
        </div>
        <div className="text-[10px] font-ms bg-red-950/50 text-red-400 border border-red-900 px-2.5 py-1 rounded">
          RESTRICTED ADMIN ACCESS
        </div>
      </div>

      {settingsMessage && (
        <div
          className={`p-4 rounded border text-xs flex items-center gap-2 ${
            settingsMessage.type === "success"
              ? "bg-ms-green/10 border-ms-green/30 text-ms-green"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {settingsMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-ms-green shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{settingsMessage.text}</span>
        </div>
      )}

      {isLoadingSettings ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded border-2 border-ms-green border-t-transparent animate-spin"></div>
          <p className="text-xs font-ms text-ms-green animate-pulse">
            PULLING ENCRYPTED CREDENTIALS...
          </p>
        </div>
      ) : (
        <form onSubmit={onSave} className="space-y-5">
          {/* Supabase Section */}
          <div className="space-y-4 border border-ms-border p-4 rounded bg-ms-bg/50">
            <h3 className="text-xs font-bold text-ms-yellow font-ms uppercase flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-ms-yellow" />
              Supabase Configuration
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                  Supabase API URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={apiSettings.supabaseUrl}
                  onChange={(e) =>
                    setApiSettings({ ...apiSettings, supabaseUrl: e.target.value })
                  }
                  className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep the saved key"
                  value={apiSettings.supabaseAnonKey}
                  onChange={(e) =>
                    setApiSettings({
                      ...apiSettings,
                      supabaseAnonKey: e.target.value,
                    })
                  }
                  className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          {/* Resend Section */}
          <div className="space-y-4 border border-ms-border p-4 rounded bg-ms-bg/50">
            <h3 className="text-xs font-bold text-ms-yellow font-ms uppercase flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-ms-yellow" />
              Resend Email Configuration
            </h3>
            <div>
              <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                Resend API Key
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep the saved key"
                value={apiSettings.resendApiKey}
                onChange={(e) =>
                  setApiSettings({ ...apiSettings, resendApiKey: e.target.value })
                }
                className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
              />
            </div>
          </div>

          {/* GoDaddy Section */}
          <div className="space-y-4 border border-ms-border p-4 rounded bg-ms-bg/50">
            <h3 className="text-xs font-bold text-ms-yellow font-ms uppercase flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-ms-yellow" />
              GoDaddy Registrar Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                  GoDaddy API Key
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep saved"
                  value={apiSettings.godaddyApiKey}
                  onChange={(e) =>
                    setApiSettings({ ...apiSettings, godaddyApiKey: e.target.value })
                  }
                  className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-ms text-ms-text-muted uppercase mb-1">
                  GoDaddy API Secret
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep saved"
                  value={apiSettings.godaddyApiSecret}
                  onChange={(e) =>
                    setApiSettings({
                      ...apiSettings,
                      godaddyApiSecret: e.target.value,
                    })
                  }
                  className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
                />
              </div>
            </div>
          </div>

          <div className="bg-ms-bg p-5 rounded-lg border border-ms-border space-y-4">
            <h3 className="text-xs font-ms text-ms-green uppercase font-bold flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              UI Preferences
            </h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-[10px] font-ms text-white uppercase mb-1">
                  Compact Mode
                </label>
                <p className="text-[10px] text-ms-text-muted">
                  Reduces padding and font sizes of idea cards to view more at
                  once.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={apiSettings.compactMode}
                  onChange={(e) =>
                    setApiSettings({
                      ...apiSettings,
                      compactMode: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-ms-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ms-text-muted peer-checked:after:bg-ms-green after:border after:rounded-full after:h-4 after:w-4 after:transition-all border border-ms-border peer-checked:border-ms-green/50"></div>
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-[10px] font-ms text-white uppercase">
                Font Face
              </label>
              <select
                value={apiSettings.fontFamily}
                onChange={(e) =>
                  setApiSettings({ ...apiSettings, fontFamily: e.target.value })
                }
                className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
              >
                <option value="inter">Inter (Default Sans)</option>
                <option value="jakarta">Plus Jakarta Sans (Modern Sans)</option>
                <option value="roboto">Roboto (Clean Sans)</option>
                <option value="mono">JetBrains Mono (Monospace)</option>
                <option value="firaCode">Fira Code (Code Mono)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-[10px] font-ms text-white uppercase">
                Font Size
              </label>
              <select
                value={apiSettings.fontSize}
                onChange={(e) =>
                  setApiSettings({ ...apiSettings, fontSize: e.target.value })
                }
                className="w-full bg-ms-card border border-ms-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-ms-green transition-colors font-sans"
              >
                <option value="sm">Small</option>
                <option value="base">Default</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-ms-border hover:bg-ms-card text-xs rounded transition-colors text-ms-text-muted hover:text-white font-ms"
            >
              BACK TO RADAR
            </button>
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2 bg-ms-green hover:bg-[#00d066] text-ms-bg font-bold text-xs rounded transition-all font-ms flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSavingSettings ? (
                <>
                  <div className="w-3 h-3 rounded-full border border-ms-bg border-t-transparent animate-spin"></div>
                  SAVING...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  COMMIT CHANGES
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
