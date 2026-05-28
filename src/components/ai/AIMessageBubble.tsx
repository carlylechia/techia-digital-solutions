import type { Message } from "./AIChatPanel";
import { AlertCircle, Bot } from "lucide-react";

interface Props {
  message: Message;
}

export function AIMessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const isError = message.isError;

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-[13px] text-white leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 mb-3">
      <div
        className={[
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full mt-0.5",
          isError ? "bg-red-500/10" : "bg-accent/10",
        ].join(" ")}
      >
        {isError ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-accent" />
        )}
      </div>
      <div
        className={[
          "max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[13px] leading-relaxed shadow-sm",
          isError
            ? "bg-red-500/5 border border-red-500/20 text-red-400"
            : "bg-surface border border-border text-primary",
        ].join(" ")}
      >
        {message.content.split("\n").map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}
