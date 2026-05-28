const AI_CHAT_TRIGGER_SELECTOR = '[data-ai-chat-trigger="true"]';

export function openAIChatWidget(fallbackHref = "/ai-consultant") {
  if (typeof window === "undefined") return;

  const trigger = document.querySelector<HTMLButtonElement>(AI_CHAT_TRIGGER_SELECTOR);
  if (trigger) {
    trigger.click();
    return;
  }

  window.location.assign(fallbackHref);
}
