import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Comma-separated admin inputs.
 *
 * These fields used to be bound to their parsed `string[]`, so the value was
 * re-derived from the list on every keystroke. Typing a separator was therefore
 * invisible: "Douala," parsed to ["Douala", ""], the empty part was dropped, and
 * the field re-rendered as "Douala". A period is not a separator, so it survived
 * and the field looked like it accepted it — which is exactly the confusing
 * asymmetry that was reported.
 *
 * The fix keeps the operator's raw text in state and parses only on submit. These
 * assertions are static (they read the component source) because the defect is
 * about how the input is wired, and a behavioural test would need a full render
 * harness for a form that calls a server action.
 */

const FORM = readFileSync(
  path.resolve(process.cwd(), "src/components/admin/outreach/outreach-campaign-form.tsx"),
  "utf8"
);
const EDITOR = readFileSync(path.resolve(process.cwd(), "src/components/blog/blog-post-editor.tsx"), "utf8");

/** The comma-separated fields of the campaign form. */
const LIST_FIELDS = ["regions", "cities", "industries", "businessTypes", "excludedIndustries", "excludedKeywords"];

describe("campaign form comma-separated fields", () => {
  it("never binds an input's value to a parsed list joined back together", () => {
    // The exact anti-pattern: `value={state.x.join(", ")}` forces the displayed
    // text to be re-derived from the parsed array on every keystroke.
    for (const field of LIST_FIELDS) {
      expect(FORM, `${field} must not render from the parsed list`).not.toContain(`value={state.${field}.join(`);
    }
  });

  it("binds each comma-separated field to its raw text draft", () => {
    for (const field of LIST_FIELDS) {
      expect(FORM, `${field} should read listDrafts.${field}`).toContain(`value={listDrafts.${field}}`);
      expect(FORM, `${field} should write its draft`).toContain(`setListDraft("${field}", event.target.value)`);
    }
  });

  it("does not reformat the text while the operator is typing", () => {
    // Parsing inside onChange is what erased the comma.
    for (const field of LIST_FIELDS) {
      expect(FORM, `${field} must not parse during typing`).not.toContain(
        `setListDraft("${field}", toList(event.target.value))`
      );
    }
  });

  it("parses the raw text once, on submit", () => {
    for (const field of LIST_FIELDS) {
      expect(FORM, `${field} should be parsed on submit`).toContain(`${field}: toList(listDrafts.${field})`);
    }
  });

  it("still splits, trims and drops empty entries", () => {
    // The fix must not weaken the parsing itself.
    expect(FORM).toContain('.split(",")');
    expect(FORM).toContain(".map((item) => item.trim())");
    expect(FORM).toContain(".filter(Boolean)");
  });

  it("seeds the drafts from a saved campaign so editing is not blank", () => {
    expect(FORM).toContain("useState<Record<ListTextField, string>>");
    expect(FORM).toContain("saved.join(\", \")");
  });

  it("keeps the checkbox-driven targetServices as a real array", () => {
    // This field is toggled, not typed, so it must stay an array.
    expect(FORM).toContain("state.targetServices.includes(service.value)");
    expect(FORM).toContain("targetServices: toList(state.targetServices.join(\",\"))");
  });
});

describe("blog editor related article IDs field", () => {
  it("does not bind the input to the parsed array", () => {
    expect(EDITOR).not.toContain('value={form.relatedPostIds.join(", ")}');
  });

  it("binds the input to a raw draft but keeps the form in sync for autosave", () => {
    expect(EDITOR).toContain("value={relatedDraft}");
    expect(EDITOR).toContain("setRelatedDraft(next)");
    // Autosave signs the form object, so the parsed list must still be updated.
    expect(EDITOR).toContain('update("relatedPostIds", next.split(",")');
  });
});
