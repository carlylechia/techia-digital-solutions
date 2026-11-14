import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";

import {
  resolveAcademyRecommendation,
  resolveAcademyRecommendationRef,
} from "@/lib/ai/academy-recommendation";

type Row = {
  slug: string;
  titleEn: string;
  titleFr: string | null;
  priceMinor: number | null;
  currency: string;
  status: string;
};

const courses: Row[] = [
  {
    slug: "ai-course",
    titleEn: "AI Course",
    titleFr: "Cours IA",
    priceMinor: 2000,
    currency: "XAF",
    status: "PUBLISHED",
  },
  {
    slug: "draft-course",
    titleEn: "Draft Course",
    titleFr: null,
    priceMinor: 2000,
    currency: "XAF",
    status: "DRAFT",
  },
  {
    slug: "shared-path",
    titleEn: "Course with shared path",
    titleFr: null,
    priceMinor: 2500,
    currency: "XAF",
    status: "PUBLISHED",
  },
];

const packs: Row[] = [
  {
    slug: "full-pack",
    titleEn: "Full Pack",
    titleFr: "Pack complet",
    priceMinor: 5000,
    currency: "XAF",
    status: "PUBLISHED",
  },
  {
    slug: "shared-path",
    titleEn: "Pack with shared path",
    titleFr: null,
    priceMinor: 5000,
    currency: "XAF",
    status: "PUBLISHED",
  },
  {
    slug: "draft-pack",
    titleEn: "Draft Pack",
    titleFr: null,
    priceMinor: 5000,
    currency: "XAF",
    status: "DRAFT",
  },
];

type Where = { slug?: { in: string[] }; status: string };

function rowsFor(rows: Row[], args: { where: Where }) {
  return rows.filter(
    (row) =>
      (!args.where.slug || args.where.slug.in.includes(row.slug)) &&
      row.status === args.where.status,
  );
}

function fakePrisma() {
  return {
    academyCourse: {
      findMany: vi.fn(async (args: { where: Where }) => rowsFor(courses, args)),
    },
    academyCoursePack: {
      findMany: vi.fn(async (args: { where: Where }) => rowsFor(packs, args)),
    },
  } as unknown as PrismaClient;
}

describe("resolveAcademyRecommendation", () => {
  it("resolves the hidden marker to the exact published pack", async () => {
    const prisma = fakePrisma();

    const recommendation = await resolveAcademyRecommendation(
      prisma,
      "en",
      "This is the best value.\n[[TECHIA_RECOMMEND:pack:full-pack]]",
      null,
    );

    expect(recommendation).toMatchObject({
      type: "pack",
      slug: "full-pack",
      title: "Full Pack",
      productPath: "/courses/full-pack",
      checkoutPath: "/courses/checkout?item=pack:full-pack",
    });
  });

  it("uses the French title and localised price for French visitors", async () => {
    const recommendation = await resolveAcademyRecommendation(
      fakePrisma(),
      "fr",
      "[[TECHIA_RECOMMEND:pack:full-pack]]",
      null,
    );

    expect(recommendation?.title).toBe("Pack complet");
    expect(recommendation?.priceLabel).toContain("5");
  });

  it("prefers the pack when a plain product link resolves both a course and a pack", async () => {
    const recommendation = await resolveAcademyRecommendation(
      fakePrisma(),
      "en",
      "See [Shared](/courses/shared-path)",
      null,
    );

    expect(recommendation).toMatchObject({ type: "pack", slug: "shared-path" });
  });

  it("never resolves an unpublished item", async () => {
    const recommendation = await resolveAcademyRecommendation(
      fakePrisma(),
      "en",
      "[[TECHIA_RECOMMEND:course:draft-course]]",
      null,
    );

    expect(recommendation).toBeNull();
  });

  it("keeps the active recommendation when the reply still mentions it", async () => {
    const recommendation = await resolveAcademyRecommendation(
      fakePrisma(),
      "en",
      "The AI Course is still the best start. You could also compare /courses/full-pack.",
      { type: "course", slug: "ai-course" },
    );

    expect(recommendation?.slug).toBe("ai-course");
  });

  it("switches to a newly recommended item when the previous one is absent", async () => {
    const recommendation = await resolveAcademyRecommendation(
      fakePrisma(),
      "en",
      "Actually, the full pack fits better: /courses/full-pack",
      { type: "course", slug: "ai-course" },
    );

    expect(recommendation).toMatchObject({ type: "pack", slug: "full-pack" });
  });

  it("falls back to a published title when the reply has no link or marker", async () => {
    const recommendation = await resolveAcademyRecommendation(
      fakePrisma(),
      "en",
      "The Full Pack is the best value because it includes everything.",
      null,
    );

    expect(recommendation).toMatchObject({ type: "pack", slug: "full-pack" });
  });

  it("does not title-match an unpublished item", async () => {
    const recommendation = await resolveAcademyRecommendation(
      fakePrisma(),
      "en",
      "The Draft Pack would fit, but it is not available yet.",
      null,
    );

    expect(recommendation).toBeNull();
  });

  it("returns null when there is no catalog signal at all", async () => {
    const recommendation = await resolveAcademyRecommendation(
      fakePrisma(),
      "en",
      "What is your current experience level?",
      null,
    );

    expect(recommendation).toBeNull();
  });
});

describe("resolveAcademyRecommendationRef", () => {
  it("validates the exact item and returns its current checkout path", async () => {
    const recommendation = await resolveAcademyRecommendationRef(
      fakePrisma(),
      "en",
      { type: "pack", slug: "full-pack" },
    );

    expect(recommendation).toMatchObject({
      type: "pack",
      slug: "full-pack",
      checkoutPath: "/courses/checkout?item=pack:full-pack",
    });
  });

  it("rejects a recommendation that is no longer published", async () => {
    const recommendation = await resolveAcademyRecommendationRef(
      fakePrisma(),
      "en",
      { type: "pack", slug: "draft-pack" },
    );

    expect(recommendation).toBeNull();
  });

  it("rejects a mismatched item type for the same slug", async () => {
    const recommendation = await resolveAcademyRecommendationRef(
      fakePrisma(),
      "en",
      { type: "course", slug: "full-pack" },
    );

    expect(recommendation).toBeNull();
  });
});
