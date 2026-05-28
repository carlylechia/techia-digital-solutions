"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, RotateCcw } from "lucide-react";

type Locale = "en" | "fr";

interface Option {
  value: string;
  label: { en: string; fr: string };
}

interface Step {
  id: string;
  question: { en: string; fr: string };
  options: Option[];
}

interface Recommendation {
  title: { en: string; fr: string };
  package: { en: string; fr: string };
  description: { en: string; fr: string };
  features: { en: string[]; fr: string[] };
  nextStep: { en: string; fr: string };
}

const STEPS: Step[] = [
  {
    id: "business_type",
    question: {
      en: "What type of business are you running?",
      fr: "Quel type d'entreprise dirigez-vous ?"
    },
    options: [
      { value: "logistics", label: { en: "Logistics / Transport / Delivery", fr: "Logistique / Transport / Livraison" } },
      { value: "travel", label: { en: "Travel / Immigration / Visa consulting", fr: "Voyage / Immigration / Conseil en visa" } },
      { value: "service", label: { en: "Service business / Consultancy / Freelance", fr: "Entreprise de services / Conseil / Freelance" } },
      { value: "clinic", label: { en: "Clinic / Healthcare / Beauty / Wellness", fr: "Clinique / Santé / Beauté / Bien-être" } },
      { value: "retail", label: { en: "Retail / E-commerce / Products", fr: "Commerce / E-commerce / Produits" } },
      { value: "other", label: { en: "Other / Not sure", fr: "Autre / Pas sûr(e)" } }
    ]
  },
  {
    id: "main_problem",
    question: {
      en: "What is your biggest challenge right now?",
      fr: "Quel est votre plus grand défi en ce moment ?"
    },
    options: [
      { value: "no_website", label: { en: "I have no website or my website is outdated", fr: "Je n'ai pas de site web ou il est obsolète" } },
      { value: "scattered_ops", label: { en: "My operations are scattered across WhatsApp, paper, or spreadsheets", fr: "Mes opérations sont dispersées sur WhatsApp, papier ou tableurs" } },
      { value: "client_tracking", label: { en: "I struggle to track clients, leads, and follow-ups", fr: "J'ai du mal à suivre les clients, prospects et relances" } },
      { value: "bookings", label: { en: "Customers need to book or request services online", fr: "Les clients ont besoin de réserver ou demander des services en ligne" } },
      { value: "quotes", label: { en: "I spend too much time generating quotes and tracking requests", fr: "Je passe trop de temps à faire des devis et suivre les demandes" } }
    ]
  },
  {
    id: "desired_outcome",
    question: {
      en: "What outcome matters most to you?",
      fr: "Quel résultat vous importe le plus ?"
    },
    options: [
      { value: "look_professional", label: { en: "Look more professional online and build trust", fr: "Paraître plus professionnel en ligne et gagner en crédibilité" } },
      { value: "save_time", label: { en: "Save time and reduce manual operations", fr: "Gagner du temps et réduire les opérations manuelles" } },
      { value: "grow_clients", label: { en: "Grow my client base and convert more leads", fr: "Développer ma clientèle et convertir plus de prospects" } },
      { value: "scale_systems", label: { en: "Build systems that can scale as the business grows", fr: "Construire des systèmes qui évoluent avec la croissance de l'entreprise" } },
      { value: "automate", label: { en: "Automate repetitive work and focus on higher-value tasks", fr: "Automatiser les tâches répétitives pour se concentrer sur des tâches à plus forte valeur ajoutée" } }
    ]
  }
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RECOMMENDATIONS: Record<string, Record<string, Record<string, Recommendation>>> = {
  logistics: {
    scattered_ops: {
      save_time: {
        title: { en: "Business OS + Quote System", fr: "Business OS + Système de devis" },
        package: { en: "Business OS", fr: "Business OS" },
        description: {
          en: "teChia will build you a custom Business Operating System with a quote generator, request tracker, and admin dashboard — replacing your scattered WhatsApp workflow.",
          fr: "teChia vous construira un Business OS personnalisé avec un générateur de devis, un suivi des demandes et un tableau de bord admin — remplaçant votre flux WhatsApp dispersé."
        },
        features: {
          en: ["Quote request form with estimate logic", "Admin request dashboard", "Status pipeline", "Email/WhatsApp notifications", "PDF quote generation"],
          fr: ["Formulaire de devis avec logique d'estimation", "Tableau de bord admin des demandes", "Pipeline de statuts", "Notifications email/WhatsApp", "Génération de devis PDF"]
        },
        nextStep: {
          en: "Click 'Request This System' to describe your workflow. teChia will recommend the best architecture.",
          fr: "Cliquez sur 'Demander ce système' pour décrire votre flux. teChia recommandera la meilleure architecture."
        }
      }
    }
  }
};

function getRecommendation(bt: string, problem: string, outcome: string): Recommendation {
  // Rule-based recommendation engine
  const packageMap: Record<string, string> = {
    no_website: "Business Pro Website",
    scattered_ops: "Business OS",
    client_tracking: "Business OS",
    bookings: "Business Pro Website",
    quotes: "Business OS"
  };

  const outcomeDescMap: Record<string, { en: string; fr: string }> = {
    look_professional: {
      en: "A premium Business Pro Website to establish your professional presence and convert visitors to clients.",
      fr: "Un Business Pro Website premium pour établir votre présence professionnelle et convertir les visiteurs en clients."
    },
    save_time: {
      en: "A Business OS that automates your core workflows and replaces manual, scattered operations.",
      fr: "Un Business OS qui automatise vos flux principaux et remplace les opérations manuelles dispersées."
    },
    grow_clients: {
      en: "A combined web presence and lead management system to attract and convert more clients.",
      fr: "Une présence web combinée et un système de gestion des prospects pour attirer et convertir plus de clients."
    },
    scale_systems: {
      en: "A modular Business OS built to grow with your business, starting with your most critical workflow.",
      fr: "Un Business OS modulaire conçu pour évoluer avec votre entreprise, en commençant par votre flux le plus critique."
    },
    automate: {
      en: "A custom automation layer built on top of your business workflow to reduce manual work.",
      fr: "Une couche d'automatisation personnalisée intégrée à votre flux métier pour réduire le travail manuel."
    }
  };

  const btDisplayMap: Record<string, { en: string; fr: string }> = {
    logistics: { en: "Logistics", fr: "Logistique" },
    travel: { en: "Travel & Immigration", fr: "Voyage et immigration" },
    service: { en: "Service / Consultancy", fr: "Services / Conseil" },
    clinic: { en: "Clinic / Healthcare", fr: "Clinique / Santé" },
    retail: { en: "Retail / E-commerce", fr: "Commerce / E-commerce" },
    other: { en: "Business", fr: "Entreprise" }
  };

  const pkg = packageMap[problem] || "Business OS";
  const btLabel = btDisplayMap[bt] || { en: "Business", fr: "Entreprise" };
  const desc = outcomeDescMap[outcome] || {
    en: "A custom solution designed for your specific business context and goals.",
    fr: "Une solution sur mesure conçue pour votre contexte et vos objectifs métier spécifiques."
  };

  const featuresByPackage: Record<string, { en: string[]; fr: string[] }> = {
    "Business Pro Website": {
      en: ["Professional bilingual website", "SEO-optimized pages", "Contact and quote forms", "WhatsApp integration", "Lead capture system", "Mobile-first design"],
      fr: ["Site web professionnel bilingue", "Pages optimisées SEO", "Formulaires de contact et devis", "Intégration WhatsApp", "Système de capture de prospects", "Design mobile-first"]
    },
    "Business OS": {
      en: ["Admin dashboard for your team", "CRM and client tracking", "Request and lead pipeline", "Status management", "Email/WhatsApp notifications", "Reporting and analytics"],
      fr: ["Tableau de bord admin pour votre équipe", "CRM et suivi clients", "Pipeline de demandes et prospects", "Gestion des statuts", "Notifications email/WhatsApp", "Rapports et analyses"]
    }
  };

  return {
    title: {
      en: `${pkg} for ${btLabel.en}`,
      fr: `${pkg} pour ${btLabel.fr}`
    },
    package: { en: pkg, fr: pkg },
    description: desc,
    features: featuresByPackage[pkg] || featuresByPackage["Business OS"],
    nextStep: {
      en: "Tell teChia more about your business to get a personalized proposal and timeline.",
      fr: "Parlez à teChia de votre entreprise pour obtenir une proposition personnalisée et un calendrier."
    }
  };
}

export function AiDigitalAdvisorDemo({ locale }: { locale: Locale }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  function handleAnswer(stepId: string, value: string) {
    const newAnswers = { ...answers, [stepId]: value };
    setAnswers(newAnswers);

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Generate recommendation
      const rec = getRecommendation(
        newAnswers.business_type || "other",
        newAnswers.main_problem || "scattered_ops",
        newAnswers.desired_outcome || "save_time"
      );
      setRecommendation(rec);
      window.dispatchEvent(new CustomEvent("techia:analytics", {
        detail: { name: "ai_advisor_recommendation_generated", params: { locale, business_type: newAnswers.business_type } }
      }));
    }
  }

  function handleReset() {
    setStepIndex(0);
    setAnswers({});
    setRecommendation(null);
  }

  const currentStep = STEPS[stepIndex];
  const progress = recommendation ? 100 : Math.round((stepIndex / STEPS.length) * 100);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              {locale === "fr" ? "Conseiller IA — Démo" : "AI Advisor — Demo"}
            </p>
            <h3 className="text-base font-bold text-primary mt-0.5">
              {locale === "fr" ? "Quel système vous faut-il ?" : "What system do you need?"}
            </h3>
          </div>
          <Sparkles className="size-8 text-accent" />
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5 text-xs text-muted">
            <span>{locale === "fr" ? "Progression" : "Progress"}</span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-background overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {!recommendation && (
            <p className="mt-1.5 text-xs text-muted">
              {locale === "fr" ? `Question ${stepIndex + 1} sur ${STEPS.length}` : `Question ${stepIndex + 1} of ${STEPS.length}`}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 grid gap-4">
        {/* Previous answers */}
        {stepIndex > 0 && !recommendation && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(answers).map(([key, val]) => {
              const step = STEPS.find((s) => s.id === key);
              const opt = step?.options.find((o) => o.value === val);
              return opt ? (
                <span key={key} className="trust-pill text-xs">✓ {opt.label[locale]}</span>
              ) : null;
            })}
          </div>
        )}

        {/* Question */}
        {!recommendation && currentStep && (
          <div className="grid gap-3">
            <p className="font-semibold text-primary leading-relaxed">{currentStep.question[locale]}</p>
            <div className="grid gap-2">
              {currentStep.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAnswer(currentStep.id, opt.value)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-left text-sm text-muted transition hover:border-accent/50 hover:bg-accent/5 hover:text-primary group"
                >
                  <span className="font-medium">{opt.label[locale]}</span>
                  <ArrowRight className="size-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div className="grid gap-4">
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/20">
                  <Sparkles className="size-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">
                    {locale === "fr" ? "Recommandation teChia" : "teChia Recommendation"}
                  </p>
                  <h4 className="text-lg font-bold text-primary">{recommendation.title[locale]}</h4>
                  <div className="mt-1 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    {recommendation.package[locale]}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{recommendation.description[locale]}</p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
                {locale === "fr" ? "Ce que cela inclut" : "What this includes"}
              </p>
              <ul className="grid gap-2">
                {recommendation.features[locale].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                {locale === "fr" ? "Prochaine étape suggérée" : "Suggested Next Step"}
              </p>
              <p className="text-sm text-muted">{recommendation.nextStep[locale]}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
              >
                <RotateCcw className="size-3.5" />
                {locale === "fr" ? "Recommencer" : "Start over"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
