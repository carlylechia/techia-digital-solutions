-- Add homepage featuring support and preserve the current seeded homepage
-- testimonials as real database records that can be moderated from admin.

ALTER TABLE "CustomerFeedback"
ADD COLUMN "nameFr" TEXT,
ADD COLUMN "roleFr" TEXT,
ADD COLUMN "quoteFr" TEXT,
ADD COLUMN "showOnHomepage" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "CustomerFeedback_showOnHomepage_displayOrder_idx"
ON "CustomerFeedback"("showOnHomepage", "displayOrder");

INSERT INTO "CustomerFeedback" (
  "id",
  "name",
  "nameFr",
  "role",
  "roleFr",
  "rating",
  "quote",
  "quoteFr",
  "source",
  "status",
  "showOnHomepage",
  "showOnFounder",
  "showOnPortfolio",
  "displayOrder",
  "consent",
  "internalNotes",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'seed-homepage-testimonial-01',
    'Local business owner',
    'Dirigeant local',
    'Cameroon SME',
    'PME camerounaise',
    5,
    $seed1$The system direction made the project feel bigger than a simple website, but still practical and organized.$seed1$,
    $seed1fr$La direction système rend le projet plus fort qu’un simple site, tout en restant pratique.$seed1fr$,
    'seed_homepage',
    'APPROVED',
    true,
    false,
    false,
    0,
    true,
    'System-seeded homepage testimonial.',
    NOW(),
    NOW()
  ),
  (
    'seed-homepage-testimonial-02',
    'Operations lead',
    'Responsable opérations',
    'Service business',
    'Entreprise de services',
    5,
    $seed2$The strongest part is how the website, dashboard, leads, and client communication are treated as one business layer.$seed2$,
    $seed2fr$Le meilleur point est l’unification du site, du tableau de bord, des prospects et de la communication client.$seed2fr$,
    'seed_homepage',
    'APPROVED',
    true,
    false,
    false,
    1,
    true,
    'System-seeded homepage testimonial.',
    NOW(),
    NOW()
  ),
  (
    'seed-homepage-testimonial-03',
    'Founder',
    'Fondatrice',
    'Travel and consulting',
    'Voyage et conseil',
    5,
    $seed3$It feels ready for international clients without losing the practical needs of local businesses.$seed3$,
    $seed3fr$La présence semble prête pour l’international sans oublier les réalités locales.$seed3fr$,
    'seed_homepage',
    'APPROVED',
    true,
    false,
    false,
    2,
    true,
    'System-seeded homepage testimonial.',
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "nameFr" = EXCLUDED."nameFr",
  "role" = EXCLUDED."role",
  "roleFr" = EXCLUDED."roleFr",
  "rating" = EXCLUDED."rating",
  "quote" = EXCLUDED."quote",
  "quoteFr" = EXCLUDED."quoteFr",
  "source" = EXCLUDED."source",
  "status" = EXCLUDED."status",
  "showOnHomepage" = EXCLUDED."showOnHomepage",
  "showOnFounder" = EXCLUDED."showOnFounder",
  "showOnPortfolio" = EXCLUDED."showOnPortfolio",
  "displayOrder" = EXCLUDED."displayOrder",
  "consent" = EXCLUDED."consent",
  "internalNotes" = EXCLUDED."internalNotes",
  "updatedAt" = NOW();
