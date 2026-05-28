"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { AIMessageBubble } from "./AIMessageBubble";
import { AIQuickActions } from "./AIQuickActions";
import { LeadCaptureCard } from "./LeadCaptureCard";
import { TypingIndicator } from "./TypingIndicator";
import { INTRO_MESSAGE, QUICK_ACTIONS } from "@/lib/ai/prompts";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

interface AIChatPanelProps {
  onClose: () => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return generateId();
  const key = "techia_ai_session";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = generateId() + generateId();
  sessionStorage.setItem(key, id);
  return id;
}

interface AgentResponse {
  message?: string;
  error?: string;
  conversationId?: string;
}

export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "intro", role: "assistant", content: INTRO_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getOrCreateSessionId());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = { id: generateId(), role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const history = messages
          .filter((m) => !m.isError && m.id !== "intro")
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/ai/techia-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionId.current,
            conversationId,
            history,
          }),
        });

        const data = (await res.json()) as AgentResponse;

        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { id: generateId(), role: "assistant", content: data.error!, isError: true },
          ]);
        } else if (data.message) {
          setMessages((prev) => [
            ...prev,
            { id: generateId(), role: "assistant", content: data.message! },
          ]);
          if (data.conversationId && !conversationId) {
            setConversationId(data.conversationId);
          }

          // Show lead capture after 4+ exchanges if not captured yet
          const totalMsgs = messages.length + 2;
          if (totalMsgs >= 8 && !leadCaptured && !showLeadCapture) {
            const lowerContent = data.message.toLowerCase();
            const contactTriggers = [
              "contact",
              "reach",
              "email",
              "phone",
              "name",
              "get in touch",
              "follow up",
              "demo",
              "proposal",
            ];
            if (contactTriggers.some((t) => lowerContent.includes(t))) {
              setShowLeadCapture(true);
            }
          }
        }
      } catch {
        const errMsg =
          "The AI assistant is temporarily unavailable. Please try again later or contact teChia directly.";
        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: "assistant", content: errMsg, isError: true },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, conversationId, leadCaptured, showLeadCapture]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const showQuickActions = messages.length <= 1;

  return (
    <div className="flex h-[600px] sm:h-[580px] max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border bg-surface shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[13px] font-semibold text-primary leading-none">
            teChia AI Growth Agent
          </p>
          <p className="text-[11px] text-muted mt-0.5">Digital Solutions Consultant</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-border hover:text-primary transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 p-4 scroll-smooth">
        {messages.map((msg) => (
          <AIMessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        {showLeadCapture && !leadCaptured && (
          <LeadCaptureCard
            conversationId={conversationId}
            onSuccess={() => {
              setLeadCaptured(true);
              setShowLeadCapture(false);
            }}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <AIQuickActions
          actions={QUICK_ACTIONS as unknown as string[]}
          onSelect={(action) => void sendMessage(action)}
          disabled={isLoading}
        />
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border bg-surface p-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about teChia's services…"
            rows={1}
            maxLength={1500}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: "40px" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted/70">
          AI assistant · Powered by teChia Digital Solutions
        </p>
      </form>
    </div>
  );
}
