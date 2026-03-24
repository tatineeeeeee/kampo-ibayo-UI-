"use client";

import { Send } from "lucide-react";

interface ChatInputProps {
  inputText: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
}

export function ChatInput({
  inputText,
  onInputChange,
  onSend,
  onKeyPress,
  disabled,
}: ChatInputProps) {
  return (
    <div className="p-3 sm:p-4 bg-card border-t border-border rounded-b-2xl">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Type your message..."
          className="flex-1 bg-background text-foreground border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-primary focus:bg-muted transition-all text-xs sm:text-sm placeholder:text-muted-foreground"
        />
        <button
          onClick={onSend}
          disabled={disabled}
          className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground p-2 sm:p-2.5 rounded-xl transition-colors shadow-lg hover:shadow-xl flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
