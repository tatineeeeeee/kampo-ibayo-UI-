"use client";

import { Message } from "./types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={`flex ${
        message.sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 sm:p-3 ${
          message.sender === "user"
            ? "bg-primary text-primary-foreground rounded-br-none shadow-lg"
            : "bg-muted text-foreground rounded-bl-none shadow-md border border-border"
        }`}
      >
        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
          {message.text}
        </p>
        <p
          className={`text-xs mt-1 ${
            message.sender === "user"
              ? "text-primary-foreground/70 text-right"
              : "text-muted-foreground text-left"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-2xl rounded-bl-none p-2.5 sm:p-3 shadow-md border border-border">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
