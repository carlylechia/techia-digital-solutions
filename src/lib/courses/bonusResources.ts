import { readFile } from "node:fs/promises";
import path from "node:path";
import { getBonusResourceContentType } from "@/lib/courses/bonusMime";
import { getBuyerBonusDefinitionById } from "@/lib/courses/bonusPacks";

export async function readBuyerBonusResource(bonusId: string) {
  const bonus = getBuyerBonusDefinitionById(bonusId);
  if (!bonus?.filePath) return null;

  const absolutePath = path.join(process.cwd(), bonus.filePath);

  try {
    const content = await readFile(absolutePath);
    return {
      bonus,
      content,
      filename: path.basename(absolutePath),
      contentType: getBonusResourceContentType(absolutePath),
    };
  } catch {
    return null;
  }
}
