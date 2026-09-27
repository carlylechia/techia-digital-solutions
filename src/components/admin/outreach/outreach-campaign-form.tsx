"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveOutreachCampaign } from "@/app/[locale]/admin/outreach/actions";
import { DISCOVERY_PROVIDER_MODES, OUTREACH_CAMPAIGN_MODES, OUTREACH_CAMPAIGN_STATUSES, OUTREACH_TARGET_SERVICES } from "@/lib/outreach/constants";
import { OutreachButton, OutreachField, outreachInputClass } from "./outreach-ui";

/**
 * Campaign configuration form.
 *
 * No API secret is ever accepted here. The only place a key is entered is the
 * server environment, so this form cannot leak or persist a credential.
 */

type CampaignDefaults = {
  id?: string;
  name: string;
  description: string;
  status: string;
  mode: string;
  country: string;
  regions: string[];
  cities: string[];
  industries: string[];
  businessTypes: string[];
  targetServices: string[];
  excludedIndustries: string[];
  excludedKeywords: string[];
  dailyDiscoveryLimit: number;
  dailySendLimit: number;
  minOpportunityScore: number;
  dailyAiAssessLimit: number;
  requireApproval: boolean;
  followUpEnabled: boolean;
  maxFollowUps: number;
  sendingWindowStart: string;
  sendingWindowEnd: string;
  timezone: string;
  discoveryProviderMode: string;
  complianceBasis: string;
  complianceNote: string;
  senderNameOverride: string;
};

const DEFAULTS: CampaignDefaults = {
  name: "",
  description: "",
  status: "DRAFT",
  mode: "SEMI_AUTOMATIC",
  country: "Cameroon",
  regions: [],
  cities: [],
  industries: [],
  businessTypes: [],
  targetServices: [],
  excludedIndustries: [],
  excludedKeywords: [],
  dailyDiscoveryLimit: 25,
  dailySendLimit: 10,
  minOpportunityScore: 40,
  dailyAiAssessLimit: 25,
  requireApproval: true,
  followUpEnabled: true,
  maxFollowUps: 2,
  sendingWindowStart: "09:00",
  sendingWindowEnd: "17:00",
  timezone: "Africa/Douala",
  discoveryProviderMode: "AUTO",
  complianceBasis: "",
  complianceNote: "",
  senderNameOverride: "",
};

function toList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function OutreachCampaignForm({ campaign }: { campaign?: Partial<CampaignDefaults> }) {
  const router = useRouter();
  const [state, setState] = useState<CampaignDefaults>({ ...DEFAULTS, ...(campaign ?? {}) });
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "good" | "danger"; text: string } | null>(null);

  function set<K extends keyof CampaignDefaults>(key: K, value: CampaignDefaults[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveOutreachCampaign({
        id: state.id,
        name: state.name,
        description: state.description,
        status: state.status,
        mode: state.mode,
        country: state.country,
        regions: toList(state.regions.join(",")),
        cities: toList(state.cities.join(",")),
        industries: toList(state.industries.join(",")),
        businessTypes: toList(state.businessTypes.join(",")),
        targetServices: toList(state.targetServices.join(",")),
        excludedIndustries: toList(state.excludedIndustries.join(",")),
        excludedKeywords: toList(state.excludedKeywords.join(",")),
        dailyDiscoveryLimit: state.dailyDiscoveryLimit,
        dailySendLimit: state.dailySendLimit,
        minOpportunityScore: state.minOpportunityScore,
        dailyAiAssessLimit: state.dailyAiAssessLimit,
        requireApproval: state.requireApproval,
        followUpEnabled: state.followUpEnabled,
        maxFollowUps: state.maxFollowUps,
        sendingWindowStart: state.sendingWindowStart,
        sendingWindowEnd: state.sendingWindowEnd,
        timezone: state.timezone,
        discoveryProviderMode: state.discoveryProviderMode,
        complianceBasis: state.complianceBasis,
        complianceNote: state.complianceNote,
        senderNameOverride: state.senderNameOverride,
      });

      if (result.ok) {
        setFeedback({ tone: "good", text: result.message });
        router.push("/admin/outreach/campaigns");
        router.refresh();
        return;
      }
      setFeedback({ tone: "danger", text: result.error });
    });
  }

  const automaticWithApproval = state.mode === "AUTOMATIC" && state.requireApproval;

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <fieldset className="subtle-tile grid gap-4 rounded-[1.25rem] p-4 sm:p-5" disabled={pending}>
        <legend className="px-1 text-sm font-semibold">Identity</legend>
        <OutreachField label="Campaign name">
          <input
            className={outreachInputClass}
            value={state.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Douala Restaurants"
            required
            maxLength={160}
          />
        </OutreachField>
        <OutreachField label="Description" hint="Optional. Visible to admins only.">
          <textarea
            className={`${outreachInputClass} min-h-20`}
            value={state.description}
            onChange={(event) => set("description", event.target.value)}
            maxLength={4000}
          />
        </OutreachField>
        <div className="grid gap-4 sm:grid-cols-2">
          <OutreachField label="Country">
            <input
              className={outreachInputClass}
              value={state.country}
              onChange={(event) => set("country", event.target.value)}
              placeholder="Cameroon"
              required
              maxLength={80}
            />
          </OutreachField>
          <OutreachField label="Timezone" hint="IANA zone used for the sending window.">
            <input
              className={outreachInputClass}
              value={state.timezone}
              onChange={(event) => set("timezone", event.target.value)}
              placeholder="Africa/Douala"
              required
              maxLength={60}
            />
          </OutreachField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <OutreachField label="Regions" hint="Comma separated.">
            <input
              className={outreachInputClass}
              value={state.regions.join(", ")}
              onChange={(event) => set("regions", toList(event.target.value))}
              placeholder="Littoral"
            />
          </OutreachField>
          <OutreachField label="Cities" hint="Comma separated. The first city leads the search query.">
            <input
              className={outreachInputClass}
              value={state.cities.join(", ")}
              onChange={(event) => set("cities", toList(event.target.value))}
              placeholder="Douala"
            />
          </OutreachField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <OutreachField label="Industries" hint="Comma separated. The first industry leads the search query.">
            <input
              className={outreachInputClass}
              value={state.industries.join(", ")}
              onChange={(event) => set("industries", toList(event.target.value))}
              placeholder="Restaurants"
            />
          </OutreachField>
          <OutreachField label="Business types" hint="Comma separated.">
            <input
              className={outreachInputClass}
              value={state.businessTypes.join(", ")}
              onChange={(event) => set("businessTypes", toList(event.target.value))}
              placeholder="Restaurant"
            />
          </OutreachField>
        </div>
        <OutreachField label="Target services" hint="Used to align AI recommendations with what teChia can deliver.">
          <div className="flex flex-wrap gap-2">
            {OUTREACH_TARGET_SERVICES.map((service) => {
              const selected = state.targetServices.includes(service.value);
              return (
                <button
                  key={service.value}
                  type="button"
                  onClick={() =>
                    set(
                      "targetServices",
                      selected ? state.targetServices.filter((item) => item !== service.value) : [...state.targetServices, service.value]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    selected ? "border-accent bg-accent text-[#001018]" : "border-border text-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  {service.label}
                </button>
              );
            })}
          </div>
        </OutreachField>
        <div className="grid gap-4 sm:grid-cols-2">
          <OutreachField label="Excluded industries" hint="Matched against name, address and type.">
            <input
              className={outreachInputClass}
              value={state.excludedIndustries.join(", ")}
              onChange={(event) => set("excludedIndustries", toList(event.target.value))}
              placeholder="bank, insurance"
            />
          </OutreachField>
          <OutreachField label="Excluded keywords" hint="Any match in a business name is skipped.">
            <input
              className={outreachInputClass}
              value={state.excludedKeywords.join(", ")}
              onChange={(event) => set("excludedKeywords", toList(event.target.value))}
              placeholder="franchise, chain"
            />
          </OutreachField>
        </div>
      </fieldset>

      <fieldset className="subtle-tile grid gap-4 rounded-[1.25rem] p-4 sm:p-5" disabled={pending}>
        <legend className="px-1 text-sm font-semibold">Automation and safety</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <OutreachField label="Status">
            <select className={outreachInputClass} value={state.status} onChange={(event) => set("status", event.target.value)}>
              {OUTREACH_CAMPAIGN_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </OutreachField>
          <OutreachField label="Automation mode" hint="MANUAL never sends. SEMI_AUTOMATIC requires approval.">
            <select className={outreachInputClass} value={state.mode} onChange={(event) => set("mode", event.target.value)}>
              {OUTREACH_CAMPAIGN_MODES.map((value) => (
                <option key={value} value={value}>
                  {value.replace("_", " ")}
                </option>
              ))}
            </select>
          </OutreachField>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4"
            checked={state.requireApproval}
            onChange={(event) => set("requireApproval", event.target.checked)}
          />
          <span>
            <span className="font-semibold">Require human approval before sending</span>
            <span className="mt-1 block text-xs text-muted">
              Strongly recommended. With this on, every message waits in the review queue and only a person can queue it.
            </span>
          </span>
        </label>

        {automaticWithApproval ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            This campaign is in AUTOMATIC mode but still requires approval, so nothing will be sent without a person
            approving each message.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OutreachField label="Daily discovery" hint="Max 200.">
            <input
              type="number"
              min={1}
              max={200}
              className={outreachInputClass}
              value={state.dailyDiscoveryLimit}
              onChange={(event) => set("dailyDiscoveryLimit", Number(event.target.value))}
            />
          </OutreachField>
          <OutreachField label="Daily sends" hint="Max 50.">
            <input
              type="number"
              min={1}
              max={50}
              className={outreachInputClass}
              value={state.dailySendLimit}
              onChange={(event) => set("dailySendLimit", Number(event.target.value))}
            />
          </OutreachField>
          <OutreachField label="Score threshold" hint="0-100.">
            <input
              type="number"
              min={0}
              max={100}
              className={outreachInputClass}
              value={state.minOpportunityScore}
              onChange={(event) => set("minOpportunityScore", Number(event.target.value))}
            />
          </OutreachField>
          <OutreachField label="Daily AI assessments" hint="Cost control.">
            <input
              type="number"
              min={0}
              max={100}
              className={outreachInputClass}
              value={state.dailyAiAssessLimit}
              onChange={(event) => set("dailyAiAssessLimit", Number(event.target.value))}
            />
          </OutreachField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <OutreachField label="Window opens" hint="24h HH:MM in campaign timezone.">
            <input
              className={outreachInputClass}
              value={state.sendingWindowStart}
              onChange={(event) => set("sendingWindowStart", event.target.value)}
              placeholder="09:00"
              pattern="^([01]\d|2[0-3]):[0-5]\d$"
            />
          </OutreachField>
          <OutreachField label="Window closes">
            <input
              className={outreachInputClass}
              value={state.sendingWindowEnd}
              onChange={(event) => set("sendingWindowEnd", event.target.value)}
              placeholder="17:00"
              pattern="^([01]\d|2[0-3]):[0-5]\d$"
            />
          </OutreachField>
          <OutreachField label="Max follow-ups" hint="0 to 3. The sequence always stops after the last one.">
            <input
              type="number"
              min={0}
              max={3}
              className={outreachInputClass}
              value={state.maxFollowUps}
              onChange={(event) => set("maxFollowUps", Number(event.target.value))}
            />
          </OutreachField>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4"
            checked={state.followUpEnabled}
            onChange={(event) => set("followUpEnabled", event.target.checked)}
          />
          <span>
            <span className="font-semibold">Enable follow-ups</span>
            <span className="mt-1 block text-xs text-muted">
              Day 3 and day 7 at most. Any reply, unsubscribe, bounce or booked meeting stops the sequence immediately.
            </span>
          </span>
        </label>

        <div className="grid gap-2">
          <OutreachField
            label="Discovery provider"
            hint="Automatic uses Google Places when available and safely falls back to OpenStreetMap when Google is unavailable or usage limits are reached."
          >
            <select
              className={outreachInputClass}
              value={state.discoveryProviderMode}
              disabled={pending}
              onChange={(event) => set("discoveryProviderMode", event.target.value)}
            >
              {DISCOVERY_PROVIDER_MODES.map((value) => (
                <option key={value} value={value}>
                  {value === "AUTO" ? "Automatic (Google Places → OpenStreetMap fallback)" : `${value.replace("_", " ")} only`}
                </option>
              ))}
            </select>
          </OutreachField>
          {state.discoveryProviderMode === "GOOGLE_PLACES" ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              This campaign uses Google Places only. If Google is not configured or is unavailable, discovery fails
              visibly rather than switching providers.
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="subtle-tile grid gap-4 rounded-[1.25rem] p-4 sm:p-5" disabled={pending}>
        <legend className="px-1 text-sm font-semibold">Compliance</legend>
        <p className="text-xs text-muted">
          Commercial email rules differ between Cameroon, the US, the EU and other markets. Record the basis for contacting
          this audience rather than assuming a single global rule. This text is shown on the campaign record and included
          in the compliance footer of every message when set.
        </p>
        <OutreachField label="Compliance basis" hint="Short statement, e.g. legitimate business interest or prior enquiry.">
          <input
            className={outreachInputClass}
            value={state.complianceBasis}
            onChange={(event) => set("complianceBasis", event.target.value)}
            maxLength={1000}
            placeholder="Prior enquiry or existing customer relationship"
          />
        </OutreachField>
        <OutreachField label="Compliance footer note" hint="Appears above the unsubscribe link.">
          <textarea
            className={`${outreachInputClass} min-h-20`}
            value={state.complianceNote}
            onChange={(event) => set("complianceNote", event.target.value)}
            maxLength={1000}
          />
        </OutreachField>
        <OutreachField label="Sender name override" hint="Leave blank to use the default sender, Chia Carlyle.">
          <input
            className={outreachInputClass}
            value={state.senderNameOverride}
            onChange={(event) => set("senderNameOverride", event.target.value)}
            maxLength={120}
          />
        </OutreachField>
      </fieldset>

      {feedback ? (
        <p
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${
            feedback.tone === "good" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <OutreachButton type="submit" disabled={pending}>
          {pending ? "Saving…" : state.id ? "Save campaign" : "Create campaign"}
        </OutreachButton>
        <OutreachButton type="button" tone="quiet" onClick={() => router.push("/admin/outreach/campaigns")} disabled={pending}>
          Cancel
        </OutreachButton>
      </div>
    </form>
  );
}
