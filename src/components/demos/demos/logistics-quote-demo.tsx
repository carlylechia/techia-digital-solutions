"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

type Locale = "en" | "fr";

const DISCLAIMER = {
  en: "Sample estimate for demonstration only. Not a commercial quote or service guarantee.",
  fr: "Estimation d'exemple à titre de démonstration uniquement. Pas un devis commercial ou une garantie de service."
};

const ORIGINS = {
  en: ["Douala", "Yaoundé", "Abidjan", "Paris", "Lagos", "Dakar", "Libreville"],
  fr: ["Douala", "Yaoundé", "Abidjan", "Paris", "Lagos", "Dakar", "Libreville"]
};

const PACKAGE_TYPES = {
  en: ["Documents", "Small package (< 5 kg)", "Standard package (5–20 kg)", "Large package (20–50 kg)", "Freight (50+ kg)"],
  fr: ["Documents", "Petit colis (< 5 kg)", "Colis standard (5–20 kg)", "Grand colis (20–50 kg)", "Fret (50+ kg)"]
};

const URGENCY = {
  en: ["Standard (5–7 days)", "Express (2–3 days)", "Urgent (Same/Next day)"],
  fr: ["Standard (5–7 jours)", "Express (2–3 jours)", "Urgent (Même jour / lendemain)"]
};

const DELIVERY = {
  en: ["Door to door", "Pick-up point collection", "Warehouse drop-off"],
  fr: ["Porte à porte", "Enlèvement en point relais", "Dépôt en entrepôt"]
};

function calcEstimate(packageType: string, urgency: string, delivery: string): { min: number; max: number; days: string } {
  const pkgWeight = packageType.includes("Document") ? 1 : packageType.includes("Small") ? 5 : packageType.includes("Standard") ? 20 : packageType.includes("Large") ? 50 : 100;
  const base = pkgWeight * 3;
  const urgencyMultiplier = urgency.includes("Urgent") || urgency.includes("même jour") ? 2.5 : urgency.includes("Express") || urgency.includes("2") ? 1.6 : 1;
  const deliveryExtra = delivery.includes("door") || delivery.includes("porte") ? 1.2 : 1;
  const min = Math.round(base * urgencyMultiplier * deliveryExtra);
  const max = Math.round(min * 1.3);
  const days = urgency.includes("Urgent") || urgency.includes("même") ? "24–48h" : urgency.includes("Express") || urgency.includes("2") ? "2–3 days" : "5–7 days";
  return { min, max, days };
}

export function LogisticsQuoteDemo({ locale }: { locale: Locale }) {
  const [step, setStep] = useState(0);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [packageType, setPackageType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [delivery, setDelivery] = useState("");
  const [result, setResult] = useState<{ min: number; max: number; days: string } | null>(null);

  const isStep0Valid = origin && destination && origin !== destination;
  const isStep1Valid = packageType;
  const isStep2Valid = urgency && delivery;

  function handleCalculate() {
    const r = calcEstimate(packageType, urgency, delivery);
    setResult(r);
    setStep(3);
    window.dispatchEvent(new CustomEvent("techia:analytics", {
      detail: { name: "demo_completed", params: { demo: "logistics-quote-generator", locale } }
    }));
  }

  function handleReset() {
    setStep(0);
    setOrigin("");
    setDestination("");
    setPackageType("");
    setUrgency("");
    setDelivery("");
    setResult(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const inputCls = "form-input rounded-lg text-sm w-full";
  const selectCls = "form-input rounded-lg text-sm w-full";

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              {locale === "fr" ? "Générateur de devis — Démo" : "Quote Generator — Demo"}
            </p>
            <h3 className="text-base font-bold text-primary mt-0.5">
              {locale === "fr" ? "Calculez votre estimation logistique" : "Calculate your logistics estimate"}
            </h3>
          </div>
          <span className="text-3xl">🚚</span>
        </div>

        {/* Progress steps */}
        <div className="mt-4 flex items-center gap-2">
          {[
            locale === "fr" ? "Itinéraire" : "Route",
            locale === "fr" ? "Colis" : "Package",
            locale === "fr" ? "Options" : "Options",
            locale === "fr" ? "Résultat" : "Result"
          ].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition ${step > i ? "bg-emerald-500 text-white" : step === i ? "bg-accent text-background" : "bg-surface border border-border text-muted"}`}>
                {step > i ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block transition ${step === i ? "text-primary" : "text-muted"}`}>{label}</span>
              {i < 3 && <div className={`h-px flex-1 mx-1 transition ${step > i ? "bg-emerald-500/60" : "bg-border"}`} style={{ width: 20 }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5">
        {/* Step 0: Route */}
        {step === 0 && (
          <div className="grid gap-4">
            <p className="text-sm text-muted">{locale === "fr" ? "D'où expédiez-vous et où ?" : "Where are you shipping from and to?"}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="form-label text-xs">{locale === "fr" ? "Ville d'origine" : "Origin city"}</label>
                <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {ORIGINS[locale].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="form-label text-xs">{locale === "fr" ? "Ville de destination" : "Destination city"}</label>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {ORIGINS[locale].filter((c) => c !== origin).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!isStep0Valid}
              className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold self-start disabled:opacity-40"
            >
              {locale === "fr" ? "Suivant →" : "Next →"}
            </button>
          </div>
        )}

        {/* Step 1: Package */}
        {step === 1 && (
          <div className="grid gap-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="font-semibold text-primary">{origin}</span> → <span className="font-semibold text-primary">{destination}</span>
            </div>
            <p className="text-sm text-muted">{locale === "fr" ? "Quel type de colis expédiez-vous ?" : "What type of package are you shipping?"}</p>
            <div className="grid gap-2">
              {PACKAGE_TYPES[locale].map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPackageType(pt)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition ${packageType === pt ? "border-accent bg-accent/10 text-primary" : "border-border hover:border-accent/40 text-muted hover:text-primary"}`}
                >
                  <span className={`size-4 rounded-full border-2 transition ${packageType === pt ? "border-accent bg-accent" : "border-border"}`} />
                  {pt}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary rounded-lg px-4 py-2.5 text-sm">← {locale === "fr" ? "Retour" : "Back"}</button>
              <button onClick={() => setStep(2)} disabled={!isStep1Valid} className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
                {locale === "fr" ? "Suivant →" : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Options */}
        {step === 2 && (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <span>{origin} → {destination}</span>
              <span className="text-accent">·</span>
              <span>{packageType}</span>
            </div>
            <div className="grid gap-1.5">
              <label className="form-label text-xs">{locale === "fr" ? "Urgence" : "Urgency"}</label>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className={selectCls}>
                <option value="">—</option>
                {URGENCY[locale].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="form-label text-xs">{locale === "fr" ? "Type de livraison" : "Delivery type"}</label>
              <select value={delivery} onChange={(e) => setDelivery(e.target.value)} className={selectCls}>
                <option value="">—</option>
                {DELIVERY[locale].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary rounded-lg px-4 py-2.5 text-sm">← {locale === "fr" ? "Retour" : "Back"}</button>
              <button onClick={handleCalculate} disabled={!isStep2Valid} className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
                {locale === "fr" ? "Calculer l'estimation" : "Calculate Estimate"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div className="grid gap-5">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
                {locale === "fr" ? "Estimation du devis" : "Quote Estimate"}
              </p>
              <p className="text-4xl font-black text-primary">
                ${result.min} – ${result.max}
              </p>
              <p className="mt-2 text-sm text-muted">
                {locale === "fr" ? "Délai estimé :" : "Estimated delivery:"} <strong className="text-primary">{result.days}</strong>
              </p>
            </div>

            <div className="rounded-lg bg-background/60 border border-border p-4 grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">{locale === "fr" ? "Itinéraire" : "Route"}</span><span className="font-semibold text-primary">{origin} → {destination}</span></div>
              <div className="flex justify-between"><span className="text-muted">{locale === "fr" ? "Colis" : "Package"}</span><span className="font-medium text-primary">{packageType}</span></div>
              <div className="flex justify-between"><span className="text-muted">{locale === "fr" ? "Urgence" : "Urgency"}</span><span className="font-medium text-primary">{urgency}</span></div>
              <div className="flex justify-between"><span className="text-muted">{locale === "fr" ? "Livraison" : "Delivery"}</span><span className="font-medium text-primary">{delivery}</span></div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-400" />
              <p className="text-xs text-yellow-300/80">{DISCLAIMER[locale]}</p>
            </div>

            <button onClick={handleReset} className="btn-secondary rounded-lg px-4 py-2.5 text-sm self-start">
              {locale === "fr" ? "Nouvelle estimation" : "New estimate"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
