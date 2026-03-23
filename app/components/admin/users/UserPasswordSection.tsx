"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  AlertTriangle,
} from "lucide-react";

interface UserPasswordSectionProps {
  userName: string;
  userEmail: string;
  tempPassword: string;
  onClose: () => void;
}

export function UserPasswordSection({
  userName,
  userEmail,
  tempPassword,
  onClose,
}: UserPasswordSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
      const el = document.getElementById("temp-password-display");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-success/10 rounded-full">
            <Check className="w-5 h-5 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            User Created Successfully
          </h2>
        </div>

        {/* User info card */}
        <div className="bg-muted rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-foreground">{userName}</p>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>

        {/* Temporary password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Temporary Password
          </label>
          <div className="flex items-center gap-2">
            <code
              id="temp-password-display"
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground select-all"
            >
              {tempPassword}
            </code>
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                copied
                  ? "bg-success/10 text-success"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-warning/10 border-l-4 border-warning p-3 mb-5 rounded-r-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-warning">
              This password will only be shown once. Please share it securely
              with the new user. They can change it later via password reset.
            </p>
          </div>
        </div>

        {/* Done button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
