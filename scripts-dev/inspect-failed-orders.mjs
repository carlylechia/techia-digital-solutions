import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const line = fs
  .readFileSync(".env.prod.vercel", "utf8")
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="));
const cs = line.slice(13).trim().replace(/^"|"$/g, "");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: cs }) });

const orders = await prisma.academyOrder.findMany({
  orderBy: { createdAt: "desc" },
  take: 6,
  select: {
    reference: true,
    provider: true,
    status: true,
    notes: true,
    failedAt: true,
    createdAt: true,
    items: { select: { type: true, slugSnapshot: true, unitPriceMinor: true } },
    payments: { select: { status: true, failureReason: true, providerReference: true } },
  },
});

for (const o of orders) {
  console.log(
    [
      o.createdAt.toISOString(),
      o.reference,
      o.provider,
      o.status,
      JSON.stringify(o.items.map((i) => `${i.type}:${i.slugSnapshot}:${i.unitPriceMinor}`)),
      "notes=" + JSON.stringify(o.notes),
      "payments=" +
        JSON.stringify(o.payments.map((p) => `${p.status}:${p.failureReason ?? ""}`)),
    ].join(" | "),
  );
}
await prisma.$disconnect();
