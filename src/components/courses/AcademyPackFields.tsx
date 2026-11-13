import type { ReactNode } from "react";
import { AcademyImageField } from "@/components/courses/AcademyImageField";
import {
  AcademyPackCoursePicker,
  type AcademyPackCourseOption,
} from "@/components/courses/AcademyPackCoursePicker";
import {
  ACADEMY_CURRENCY_OPTIONS,
  academyHintClass as hintClass,
  academyInputClass as inputClass,
  academyLabelClass as labelClass,
} from "@/components/courses/academy-form-styles";

export type AcademyPackFormValues = {
  slug: string;
  titleEn: string;
  titleFr: string | null;
  shortTitleEn: string | null;
  shortTitleFr: string | null;
  categoryLabelEn: string;
  categoryLabelFr: string | null;
  taglineEn: string;
  taglineFr: string | null;
  summaryEn: string;
  summaryFr: string | null;
  descriptionEn: string;
  descriptionFr: string | null;
  bestForEn: string[];
  bestForFr: string[];
  learningOutcomesEn: string[];
  learningOutcomesFr: string[];
  whyChooseEn: string[];
  whyChooseFr: string[];
  level: string;
  recommended: boolean;
  badgeEn: string | null;
  badgeFr: string | null;
  status: string;
  priceMinor: number | null;
  compareAtPriceMinor: number | null;
  currency: string;
  chariowProductId: string | null;
  imageUrl: string | null;
  seoTitleEn: string | null;
  seoTitleFr: string | null;
  seoDescriptionEn: string | null;
  seoDescriptionFr: string | null;
  position: number;
  items: { courseId: string }[];
};

function Fieldset({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-border bg-surface-strong/40 p-4">
      <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
        {title}
      </legend>
      {description ? (
        <p className="mt-1 text-xs leading-6 text-muted">{description}</p>
      ) : null}
      <div className="mt-3 grid gap-4">{children}</div>
    </fieldset>
  );
}

/**
 * Every editable field on AcademyCoursePack, shared by the create and edit
 * forms so new pack controls cannot drift between the two workflows.
 */
export function AcademyPackFields({
  pack,
  courses,
}: {
  pack?: AcademyPackFormValues | null;
  courses: AcademyPackCourseOption[];
}) {
  const isEditing = Boolean(pack);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Title (EN) *
          <input
            name="titleEn"
            required
            defaultValue={pack?.titleEn ?? ""}
            className={inputClass}
            placeholder="e.g. Complete Digital Skills Pack"
          />
        </label>
        <label className={labelClass}>
          Title (FR)
          <input
            name="titleFr"
            defaultValue={pack?.titleFr ?? ""}
            className={inputClass}
            placeholder="Titre en français"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Slug {isEditing ? "" : <span className="normal-case text-muted/70">(auto from title if blank)</span>}
          <input
            name="slug"
            defaultValue={pack?.slug ?? ""}
            className={inputClass}
            placeholder="complete-digital-skills-pack"
          />
          <span className={hintClass}>
            Public URL: /courses/&lt;slug&gt;. Changing it changes the live link.
          </span>
        </label>
        <label className={labelClass}>
          Status
          <select
            name="status"
            defaultValue={pack?.status ?? "DRAFT"}
            className={inputClass}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <span className={hintClass}>
            Only published packs appear on the storefront.
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Short title (EN)
          <input
            name="shortTitleEn"
            defaultValue={pack?.shortTitleEn ?? ""}
            className={inputClass}
            placeholder="Digital Skills Pack"
          />
        </label>
        <label className={labelClass}>
          Short title (FR)
          <input
            name="shortTitleFr"
            defaultValue={pack?.shortTitleFr ?? ""}
            className={inputClass}
            placeholder="Pack Compétences Digitales"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Category label (EN) *
          <input
            name="categoryLabelEn"
            required
            defaultValue={pack?.categoryLabelEn ?? ""}
            className={inputClass}
            placeholder="Complete career bundle"
          />
        </label>
        <label className={labelClass}>
          Category label (FR)
          <input
            name="categoryLabelFr"
            defaultValue={pack?.categoryLabelFr ?? ""}
            className={inputClass}
            placeholder="Pack carrière complet"
          />
        </label>
      </div>

      <Fieldset
        title="Storefront copy"
        description="These fields control the pack card, pack detail hero, and purchase page."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Tagline (EN) *
            <textarea
              name="taglineEn"
              required
              rows={2}
              defaultValue={pack?.taglineEn ?? ""}
              className={inputClass}
              placeholder="One strong sentence for the top of the pack page."
            />
          </label>
          <label className={labelClass}>
            Tagline (FR)
            <textarea
              name="taglineFr"
              rows={2}
              defaultValue={pack?.taglineFr ?? ""}
              className={inputClass}
              placeholder="Une phrase forte pour le haut de la page."
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Summary (EN) *
            <textarea
              name="summaryEn"
              required
              rows={3}
              defaultValue={pack?.summaryEn ?? ""}
              className={inputClass}
              placeholder="Short summary shown on the pack card."
            />
          </label>
          <label className={labelClass}>
            Summary (FR)
            <textarea
              name="summaryFr"
              rows={3}
              defaultValue={pack?.summaryFr ?? ""}
              className={inputClass}
              placeholder="Résumé court affiché sur la carte du pack."
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Description (EN) *
            <textarea
              name="descriptionEn"
              required
              rows={5}
              defaultValue={pack?.descriptionEn ?? ""}
              className={inputClass}
              placeholder="Full pack description."
            />
          </label>
          <label className={labelClass}>
            Description (FR)
            <textarea
              name="descriptionFr"
              rows={5}
              defaultValue={pack?.descriptionFr ?? ""}
              className={inputClass}
              placeholder="Description complète du pack."
            />
          </label>
        </div>
      </Fieldset>

      <Fieldset
        title="Marketing bullet lists"
        description="Enter one item per line. These appear as benefit bullets on the storefront."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Best for (EN)
            <textarea
              name="bestForEn"
              rows={4}
              defaultValue={pack?.bestForEn.join("\n") ?? ""}
              className={inputClass}
              placeholder={"Beginners changing careers\nEntrepreneurs building a digital skill set"}
            />
          </label>
          <label className={labelClass}>
            Best for (FR)
            <textarea
              name="bestForFr"
              rows={4}
              defaultValue={pack?.bestForFr.join("\n") ?? ""}
              className={inputClass}
              placeholder={"Débutants en reconversion\nEntrepreneurs"}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Learning outcomes (EN)
            <textarea
              name="learningOutcomesEn"
              rows={4}
              defaultValue={pack?.learningOutcomesEn.join("\n") ?? ""}
              className={inputClass}
              placeholder={"Build a practical digital workflow\nPublish and measure your work"}
            />
          </label>
          <label className={labelClass}>
            Learning outcomes (FR)
            <textarea
              name="learningOutcomesFr"
              rows={4}
              defaultValue={pack?.learningOutcomesFr.join("\n") ?? ""}
              className={inputClass}
              placeholder={"Construire un flux de travail digital\nPublier et mesurer vos résultats"}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Why choose this pack (EN)
            <textarea
              name="whyChooseEn"
              rows={4}
              defaultValue={pack?.whyChooseEn.join("\n") ?? ""}
              className={inputClass}
              placeholder={"One payment for every course\nA clear learning path"}
            />
          </label>
          <label className={labelClass}>
            Why choose this pack (FR)
            <textarea
              name="whyChooseFr"
              rows={4}
              defaultValue={pack?.whyChooseFr.join("\n") ?? ""}
              className={inputClass}
              placeholder={"Un paiement pour tous les cours\nUn parcours clair"}
            />
          </label>
        </div>
      </Fieldset>

      <Fieldset
        title="Courses in this pack"
        description="Control exactly which published courses are included and the order they appear in."
      >
        <AcademyPackCoursePicker
          courses={courses}
          initialCourseIds={pack?.items.map((item) => item.courseId) ?? []}
        />
      </Fieldset>

      <Fieldset
        title="Pricing & delivery"
        description="Prices are stored in integer minor units. Blank XAF prices use the storefront default."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className={labelClass}>
            Currency
            <select
              name="currency"
              defaultValue={pack?.currency ?? "XAF"}
              className={inputClass}
            >
              {ACADEMY_CURRENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Price (minor units)
            <input
              name="priceMinor"
              type="number"
              min={0}
              defaultValue={pack?.priceMinor ?? ""}
              className={inputClass}
              placeholder="e.g. 25000"
            />
            <span className={hintClass}>
              Blank = default 5,000 FCFA (XAF only)
            </span>
          </label>
          <label className={labelClass}>
            Compare-at (minor)
            <input
              name="compareAtPriceMinor"
              type="number"
              min={0}
              defaultValue={pack?.compareAtPriceMinor ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Chariow product ID
            <input
              name="chariowProductId"
              defaultValue={pack?.chariowProductId ?? ""}
              className={inputClass}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className={labelClass}>
            Level
            <select
              name="level"
              defaultValue={pack?.level ?? "BEGINNER_TO_INTERMEDIATE"}
              className={inputClass}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="BEGINNER_TO_INTERMEDIATE">
                Beginner → Intermediate
              </option>
              <option value="INTERMEDIATE">Intermediate</option>
            </select>
          </label>
          <label className={labelClass}>
            Position
            <input
              name="position"
              type="number"
              defaultValue={pack?.position ?? 0}
              className={inputClass}
            />
            <span className={hintClass}>Lower numbers appear first.</span>
          </label>
          <label className={labelClass}>
            Badge (EN)
            <input
              name="badgeEn"
              defaultValue={pack?.badgeEn ?? ""}
              className={inputClass}
              placeholder="Best value"
            />
          </label>
          <label className={labelClass}>
            Badge (FR)
            <input
              name="badgeFr"
              defaultValue={pack?.badgeFr ?? ""}
              className={inputClass}
              placeholder="Meilleure offre"
            />
          </label>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
          <input
            type="checkbox"
            name="recommended"
            defaultChecked={pack?.recommended ?? false}
            className="mt-0.5 size-4 accent-cyan-400"
          />
          <span>
            <span className="block text-sm font-semibold text-primary">
              Recommended pack
            </span>
            <span className="mt-1 block text-xs text-muted">
              Featured placement on the storefront and pack detail pages.
            </span>
          </span>
        </label>
        <AcademyImageField
          name="imageUrl"
          defaultValue={pack?.imageUrl ?? ""}
          label="Pack cover image"
        />
      </Fieldset>

      <Fieldset title="SEO">
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            SEO title (EN)
            <input
              name="seoTitleEn"
              defaultValue={pack?.seoTitleEn ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            SEO title (FR)
            <input
              name="seoTitleFr"
              defaultValue={pack?.seoTitleFr ?? ""}
              className={inputClass}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            SEO description (EN)
            <textarea
              name="seoDescriptionEn"
              rows={3}
              defaultValue={pack?.seoDescriptionEn ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            SEO description (FR)
            <textarea
              name="seoDescriptionFr"
              rows={3}
              defaultValue={pack?.seoDescriptionFr ?? ""}
              className={inputClass}
            />
          </label>
        </div>
      </Fieldset>
    </div>
  );
}
