"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

type Locale = "en" | "fr";

const DISCLAIMER = {
  en: "Sample estimate for demonstration only. No real booking is submitted.",
  fr: "Simulation à titre de démonstration uniquement. Aucune réservation réelle n'est soumise."
};

interface Service {
  id: string;
  name: { en: string; fr: string };
  duration: { en: string; fr: string };
  price: string;
  description: { en: string; fr: string };
}

const SERVICES: Service[] = [
  {
    id: "consultation",
    name: { en: "Initial Consultation", fr: "Consultation initiale" },
    duration: { en: "45 min", fr: "45 min" },
    price: "$40",
    description: { en: "First meeting to assess needs and discuss options.", fr: "Premier rendez-vous pour évaluer les besoins et discuter des options." }
  },
  {
    id: "followup",
    name: { en: "Follow-up Session", fr: "Séance de suivi" },
    duration: { en: "30 min", fr: "30 min" },
    price: "$25",
    description: { en: "Progress check and next steps review.", fr: "Bilan de progression et revue des prochaines étapes." }
  },
  {
    id: "workshop",
    name: { en: "Group Workshop", fr: "Atelier de groupe" },
    duration: { en: "90 min", fr: "90 min" },
    price: "$75",
    description: { en: "Team training session with live exercises.", fr: "Session de formation en équipe avec exercices en direct." }
  },
  {
    id: "strategy",
    name: { en: "Strategy Session", fr: "Séance stratégique" },
    duration: { en: "60 min", fr: "60 min" },
    price: "$60",
    description: { en: "Deep-dive planning session for business decisions.", fr: "Session de planification approfondie pour les décisions métier." }
  }
];

const AVAILABLE_TIMES = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
const UNAVAILABLE = new Set(["10:00", "15:00"]);

function getDates(): Array<{ date: Date; label: string; day: string }> {
  const dates = [];
  const base = new Date(2025, 11, 1); // Fixed demo date (Dec 2025)
  for (let i = 1; i <= 10; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push({
        date: d,
        label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        day: d.toLocaleDateString("en-GB", { weekday: "short" })
      });
    }
  }
  return dates;
}

export function BookingSystemDemo({ locale }: { locale: Locale }) {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);

  const dates = getDates();

  function handleConfirm() {
    setConfirmed(true);
    setStep(3);
    window.dispatchEvent(new CustomEvent("techia:analytics", {
      detail: { name: "demo_completed", params: { demo: "booking-system", locale } }
    }));
  }

  function handleReset() {
    setStep(0);
    setService(null);
    setDate("");
    setTime("");
    setConfirmed(false);
  }

  const steps = {
    en: ["Service", "Date", "Time", "Confirm"],
    fr: ["Service", "Date", "Heure", "Confirmer"]
  };

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/5 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              {locale === "fr" ? "Système de réservation — Démo" : "Booking System — Demo"}
            </p>
            <h3 className="text-base font-bold text-primary mt-0.5">
              {locale === "fr" ? "Réservez une session" : "Book a Session"}
            </h3>
          </div>
          <span className="text-3xl">📅</span>
        </div>

        {/* Steps */}
        <div className="mt-4 flex items-center gap-2">
          {steps[locale].map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`flex size-6 items-center justify-center rounded-full text-xs font-bold transition ${step > i ? "bg-emerald-500 text-white" : step === i ? "bg-accent text-background" : "bg-surface border border-border text-muted"}`}>
                {step > i ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i ? "text-primary font-semibold" : "text-muted"}`}>{label}</span>
              {i < 3 && <div className={`w-4 h-px ${step > i ? "bg-emerald-500/60" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 grid gap-4">
        {/* Step 0: Service selection */}
        {step === 0 && (
          <div className="grid gap-3">
            <p className="text-sm text-muted">{locale === "fr" ? "Choisissez un service :" : "Choose a service:"}</p>
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setService(s); setStep(1); }}
                className={`flex items-start justify-between gap-4 rounded-xl border text-left p-4 transition ${service?.id === s.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/40 bg-background"}`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-primary">{s.name[locale]}</p>
                  <p className="mt-0.5 text-xs text-muted line-clamp-1">{s.description[locale]}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                    <Clock className="size-3 text-accent" />
                    <span>{s.duration[locale]}</span>
                  </div>
                </div>
                <p className="shrink-0 text-lg font-black text-primary">{s.price}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Date */}
        {step === 1 && service && (
          <div className="grid gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-primary">{service.name[locale]}</span>
              <span className="text-muted">·</span>
              <span className="text-muted">{service.price}</span>
            </div>
            <p className="text-sm text-muted">{locale === "fr" ? "Choisissez une date :" : "Choose a date:"}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {dates.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => { setDate(d.label); setStep(2); }}
                  className={`flex flex-col items-center rounded-lg border p-3 text-xs transition ${date === d.label ? "border-accent bg-accent/10 text-primary" : "border-border hover:border-accent/40 text-muted hover:text-primary"}`}
                >
                  <span className="font-semibold text-xs text-muted">{d.day}</span>
                  <span className="mt-0.5 font-bold text-sm">{d.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)} className="btn-secondary rounded-lg px-4 py-2.5 text-sm self-start">← {locale === "fr" ? "Retour" : "Back"}</button>
          </div>
        )}

        {/* Step 2: Time */}
        {step === 2 && service && (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2 text-sm text-muted">
              <span className="font-semibold text-primary">{service.name[locale]}</span>
              <span>·</span>
              <span className="font-semibold text-primary">{date}</span>
            </div>
            <p className="text-sm text-muted">{locale === "fr" ? "Choisissez un créneau :" : "Choose a time slot:"}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {AVAILABLE_TIMES.map((t) => {
                const unavailable = UNAVAILABLE.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={unavailable}
                    onClick={() => { setTime(t); setStep(3); }}
                    className={`rounded-lg border p-3 text-sm font-semibold transition ${unavailable ? "border-border text-border cursor-not-allowed opacity-40" : time === t ? "border-accent bg-accent/10 text-primary" : "border-border hover:border-accent/40 text-muted hover:text-primary"}`}
                  >
                    {unavailable ? <span className="line-through">{t}</span> : t}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep(1)} className="btn-secondary rounded-lg px-4 py-2.5 text-sm self-start">← {locale === "fr" ? "Retour" : "Back"}</button>
          </div>
        )}

        {/* Step 3: Review + Confirm */}
        {step === 3 && !confirmed && service && (
          <div className="grid gap-4">
            <p className="font-semibold text-primary">{locale === "fr" ? "Résumé de la réservation" : "Booking Summary"}</p>
            <div className="rounded-xl border border-border bg-background p-4 grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">{locale === "fr" ? "Service" : "Service"}</span><span className="font-semibold text-primary">{service.name[locale]}</span></div>
              <div className="flex justify-between"><span className="text-muted">{locale === "fr" ? "Durée" : "Duration"}</span><span className="text-primary">{service.duration[locale]}</span></div>
              <div className="flex justify-between"><span className="text-muted">{locale === "fr" ? "Date" : "Date"}</span><span className="text-primary">{date}</span></div>
              <div className="flex justify-between"><span className="text-muted">{locale === "fr" ? "Heure" : "Time"}</span><span className="text-primary">{time}</span></div>
              <div className="flex justify-between border-t border-border pt-2 mt-1"><span className="font-bold text-muted">{locale === "fr" ? "Prix" : "Price"}</span><span className="text-xl font-black text-primary">{service.price}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary rounded-lg px-4 py-2.5 text-sm">← {locale === "fr" ? "Retour" : "Back"}</button>
              <button onClick={handleConfirm} className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold">
                {locale === "fr" ? "Confirmer la réservation" : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}

        {/* Confirmed */}
        {confirmed && (
          <div className="text-center grid gap-4 py-4">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="size-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{locale === "fr" ? "Réservation confirmée !" : "Booking Confirmed!"}</p>
              <p className="mt-1 text-sm text-muted">
                {locale === "fr"
                  ? "Une confirmation vous serait envoyée par email dans un vrai système."
                  : "In a real system, a confirmation would be sent to your email."}
              </p>
            </div>
            <button onClick={handleReset} className="btn-secondary rounded-lg px-4 py-2.5 text-sm mx-auto">
              {locale === "fr" ? "Nouvelle réservation" : "New booking"}
            </button>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-400" />
          <p className="text-xs text-yellow-300/80">{DISCLAIMER[locale]}</p>
        </div>
      </div>
    </div>
  );
}
