import { createHash } from "crypto";
import { AI_CONFIG } from "./config";

export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + AI_CONFIG.ipHashSalt)
    .digest("hex")
    .substring(0, 32);
}
