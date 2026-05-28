"use client";

import { useState } from "react";
import { CheckCircle2, Clock, FileText, User, AlertTriangle } from "lucide-react";

type Locale = "en" | "fr";

const DISCLAIMER = {
  en: "Sample data for demonstration only. Not real client information.",
  fr: "Données d'exemple à titre de démonstration uniquement. Pas d'informations clients réelles."
};

type AppStatus =
  | "New Inquiry"
  | "Documents Pending"
  | "In Review"
  | "Interview Scheduled"
  | "Approved"
  | "Rejected";

interface Application {
  id: string;
  name: string;
  country: string;
  service: string;
  status: AppStatus;
  progress: number;
  nextAction: { en: string; fr: string };
  documents: Array<{ label: string; done: boolean }>;
}

const STATUS_COLORS: Record<AppStatus, string> = {
  "New Inquiry": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Documents Pending": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "In Review": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "Interview Scheduled": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Approved": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "Rejected": "text-red-400 bg-red-400/10 border-red-400/20"
};

const SAMPLE_APPS: Application[] = [
  {
    id: "APP-001",
    name: "Marie Lefebvre",
    country: "Cameroon → France",
    service: "Student Visa",
    status: "Approved",
    progress: 100,
    nextAction: { en: "Application complete. Await visa stamp.", fr: "Dossier complet. Attendre le tampon de visa." },
    documents: [
      { label: "Passport copy", done: true },
      { label: "Admission letter", done: true },
      { label: "Bank statement", done: true },
      { label: "Health insurance", done: true }
    ]
  },
  {
    id: "APP-002",
    name: "Joseph Mbeki",
    country: "Nigeria → Canada",
    service: "Work Permit",
    status: "Documents Pending",
    progress: 35,
    nextAction: { en: "Upload bank statement and employment offer.", fr: "Téléverser le relevé bancaire et l'offre d'emploi." },
    documents: [
      { label: "Passport copy", done: true },
      { label: "Job offer letter", done: true },
      { label: "Bank statement (6 months)", done: false },
      { label: "Medical certificate", done: false }
    ]
  },
  {
    id: "APP-003",
    name: "Ama Asante",
    country: "Ghana → UK",
    service: "Student Visa",
    status: "In Review",
    progress: 70,
    nextAction: { en: "Awaiting UKVI decision. Expected 2–3 weeks.", fr: "En attente de la décision UKVI. Délai estimé : 2–3 semaines." },
    documents: [
      { label: "CAS reference", done: true },
      { label: "English test result", done: true },
      { label: "Financial evidence", done: true },
      { label: "Biometric appointment", done: false }
    ]
  },
  {
    id: "APP-004",
    name: "Paul Ndiaye",
    country: "Senegal → Germany",
    service: "Skilled Worker Visa",
    status: "Interview Scheduled",
    progress: 85,
    nextAction: { en: "Interview at embassy on Friday at 10:00.", fr: "Entretien à l'ambassade vendredi à 10h00." },
    documents: [
      { label: "Qualification recognition", done: true },
      { label: "CV (German)", done: true },
      { label: "Employment contract", done: true },
      { label: "Language certificate (B1)", done: true }
    ]
  },
  {
    id: "APP-005",
    name: "Ngo Thi Lan",
    country: "Vietnam → France",
    service: "Long-stay Visa",
    status: "New Inquiry",
    progress: 10,
    nextAction: { en: "Schedule discovery call to review eligibility.", fr: "Planifier un appel de découverte pour évaluer l'éligibilité." },
    documents: [
      { label: "Passport copy", done: false },
      { label: "Proof of accommodation", done: false },
      { label: "Bank statement", done: false },
      { label: "Purpose statement", done: false }
    ]
  }
];

const INSIGHTS = {
  en: [
    { label: "Total applications", value: "34" },
    { label: "Approved this month", value: "8" },
    { label: "Pending documents", value: "5" },
    { label: "Appointments this week", value: "3" }
  ],
  fr: [
    { label: "Total des dossiers", value: "34" },
    { label: "Approuvés ce mois", value: "8" },
    { label: "Documents en attente", value: "5" },
    { label: "Rendez-vous cette semaine", value: "3" }
  ]
};

export function TravelDashboardDemo({ locale }: { locale: Locale }) {
  const [selected, setSelected] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<AppStatus | "All">("All");

  const filtered = filterStatus === "All" ? SAMPLE_APPS : SAMPLE_APPS.filter((a) => a.status === filterStatus);

  const statuses: Array<AppStatus | "All"> = ["All", "New Inquiry", "Documents Pending", "In Review", "Interview Scheduled", "Approved"];

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/5 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              {locale === "fr" ? "Tableau de bord — Démo" : "Dashboard — Demo"}
            </p>
            <h3 className="text-base font-bold text-primary mt-0.5">
              {locale === "fr" ? "Gestion des dossiers de voyage" : "Travel Application Management"}
            </h3>
          </div>
          <span className="text-3xl">✈️</span>
        </div>

        {/* Insight cards */}
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {INSIGHTS[locale].map((ins) => (
            <div key={ins.label} className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-center">
              <p className="text-xl font-black text-primary">{ins.value}</p>
              <p className="text-xs text-muted mt-0.5 leading-tight">{ins.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 grid gap-4">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filterStatus === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent/30 hover:text-primary"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Application list */}
        <div className="grid gap-2">
          {filtered.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => setSelected(selected?.id === app.id ? null : app)}
              className={`w-full rounded-xl border text-left transition ${selected?.id === app.id ? "border-accent/50 bg-accent/5" : "border-border hover:border-accent/30 bg-background"} p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10">
                    <User className="size-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-primary truncate">{app.name}</p>
                    <p className="text-xs text-muted">{app.country} · {app.service}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[app.status]}`}>
                  {app.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1 text-xs text-muted">
                  <span>{locale === "fr" ? "Avancement" : "Progress"}</span>
                  <span className="font-semibold text-primary">{app.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-background overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${app.progress}%` }} />
                </div>
              </div>

              {/* Expanded detail */}
              {selected?.id === app.id && (
                <div className="mt-4 grid gap-3 border-t border-border pt-3">
                  <div className="flex items-start gap-2 rounded-lg bg-accent/5 border border-accent/20 px-3 py-2">
                    <Clock className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    <p className="text-xs text-muted">
                      <span className="font-semibold text-primary">{locale === "fr" ? "Prochaine action : " : "Next action: "}</span>
                      {app.nextAction[locale]}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{locale === "fr" ? "Checklist documents" : "Document Checklist"}</p>
                    <ul className="grid gap-1.5">
                      {app.documents.map((doc) => (
                        <li key={doc.label} className="flex items-center gap-2 text-xs">
                          {doc.done ? (
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                          ) : (
                            <FileText className="size-3.5 shrink-0 text-yellow-400" />
                          )}
                          <span className={doc.done ? "text-muted line-through" : "text-primary"}>{doc.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-400" />
          <p className="text-xs text-yellow-300/80">{DISCLAIMER[locale]}</p>
        </div>
      </div>
    </div>
  );
}
