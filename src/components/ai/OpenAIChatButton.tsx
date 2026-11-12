"use client";

export function OpenAIChatButton({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const trigger = document.querySelector<HTMLElement>(
          '[data-ai-chat-trigger="true"]',
        );
        trigger?.click();
      }}
      className={className}
    >
      {label}
    </button>
  );
}
