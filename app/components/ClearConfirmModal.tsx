"use client";

import { AlertCircle } from "lucide-react";

interface ClearConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function ClearConfirmModal({ onCancel, onConfirm }: ClearConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-ms-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-ms-card border border-red-500/30 w-full max-w-sm rounded-lg overflow-hidden shadow-2xl relative">
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-red-950/30 border border-red-500/30 rounded flex items-center justify-center font-ms text-red-400 text-lg font-bold mx-auto mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-white font-ms">
              CLEAR ALL SAVED KITS?
            </h3>
            <p className="text-[10px] text-ms-text-muted mt-1 font-ms">
              This action is irreversible. All saved specs and development prompts
              will be permanently deleted from local storage.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-ms-bg border border-ms-border hover:bg-ms-border text-white text-xs font-ms font-bold rounded transition-all"
            >
              CANCEL
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-ms font-bold rounded transition-all"
            >
              CONFIRM DELETE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
