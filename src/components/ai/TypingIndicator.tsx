import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 mt-0.5">
        <Bot className="h-3.5 w-3.5 text-accent" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-surface border border-border px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          <span
            className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
