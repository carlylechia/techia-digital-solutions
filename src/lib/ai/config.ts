export const AI_CONFIG = {
  enabled: process.env.AI_AGENT_ENABLED !== "false",
  model: process.env.AI_PUBLIC_MODEL || "gpt-4o-mini",
  maxMessagesPerDay: parseInt(process.env.AI_PUBLIC_MAX_MESSAGES_PER_DAY || "10", 10),
  maxMessagesPerIpPerDay: parseInt(process.env.AI_PUBLIC_MAX_MESSAGES_PER_IP_PER_DAY || "40", 10),
  maxMessagesPerConversation: parseInt(process.env.AI_PUBLIC_MAX_MESSAGES_PER_CONVERSATION || "12", 10),
  maxUserMessageChars: parseInt(process.env.AI_PUBLIC_MAX_USER_MESSAGE_CHARS || "1500", 10),
  maxOutputTokens: parseInt(process.env.AI_PUBLIC_MAX_OUTPUT_TOKENS || "500", 10),
  dailyTokenBudget: parseInt(process.env.AI_DAILY_TOKEN_BUDGET || "100000", 10),
  ipHashSalt: process.env.AI_IP_HASH_SALT || "techia-ai-default",
  costPerInputToken: 0.00000015, // gpt-4o-mini pricing
  costPerOutputToken: 0.0000006,
} as const;
