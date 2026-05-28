"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, TrendingUp, Users, ClipboardList, DollarSign } from "lucide-react";

type Locale = "en" | "fr";

const DISCLAIMER = {
  en: "Sample data for demonstration only. Not real business information.",
  fr: "Données d'exemple à titre de démonstration uniquement. Pas d'informations métier réelles."
};

type Tab = "overview" | "leads" | "tasks" | "customers";

const METRICS = {
  en: [
    { label: "Monthly Revenue", value: "$8,450", icon: DollarSign, change: "+12%" },
    { label: "Active Leads", value: "23", icon: Users, change: "+3 this week" },
    { label: "Open Tasks", value: "11", icon: ClipboardList, change: "4 due today" },
    { label: "Conversion Rate", value: "34%", icon: TrendingUp, change: "↑ from 28%" }
  ],
  fr: [
    { label: "Revenus mensuels", value: "8 450 $", icon: DollarSign, change: "+12 %" },
    { label: "Prospects actifs", value: "23", icon: Users, change: "+3 cette semaine" },
    { label: "Tâches ouvertes", value: "11", icon: ClipboardList, change: "4 dues aujourd'hui" },
    { label: "Taux de conversion", value: "34 %", icon: TrendingUp, change: "↑ depuis 28 %" }
  ]
};

const LEADS = {
  en: [
    { name: "Bright Logistics", stage: "Discovery", value: "$2,400", urgent: true },
    { name: "Madeleine Salon", stage: "Proposal", value: "$850", urgent: false },
    { name: "Green Market", stage: "Negotiation", value: "$3,200", urgent: true },
    { name: "Urban Clinique", stage: "New", value: "$1,600", urgent: false },
    { name: "TechFlow Ltd", stage: "Closed Won", value: "$5,000", urgent: false }
  ],
  fr: [
    { name: "Bright Logistics", stage: "Découverte", value: "2 400 $", urgent: true },
    { name: "Salon Madeleine", stage: "Proposition", value: "850 $", urgent: false },
    { name: "Marché Vert", stage: "Négociation", value: "3 200 $", urgent: true },
    { name: "Clinique Urbaine", stage: "Nouveau", value: "1 600 $", urgent: false },
    { name: "TechFlow SARL", stage: "Gagné", value: "5 000 $", urgent: false }
  ]
};

const STAGE_COLORS: Record<string, string> = {
  "Discovery": "text-blue-400 bg-blue-400/10",
  "Découverte": "text-blue-400 bg-blue-400/10",
  "Proposal": "text-purple-400 bg-purple-400/10",
  "Proposition": "text-purple-400 bg-purple-400/10",
  "Negotiation": "text-orange-400 bg-orange-400/10",
  "Négociation": "text-orange-400 bg-orange-400/10",
  "New": "text-cyan-400 bg-cyan-400/10",
  "Nouveau": "text-cyan-400 bg-cyan-400/10",
  "Closed Won": "text-emerald-400 bg-emerald-400/10",
  "Gagné": "text-emerald-400 bg-emerald-400/10"
};

const TASKS_EN = [
  { text: "Follow up with Green Market on pricing", priority: "High", due: "Today", done: false },
  { text: "Send proposal to Madeleine Salon", priority: "Medium", due: "Tomorrow", done: false },
  { text: "Review Urban Clinique onboarding docs", priority: "Low", due: "Friday", done: false },
  { text: "Update Bright Logistics CRM record", priority: "Medium", due: "Today", done: true },
  { text: "Schedule call with TechFlow Ltd", priority: "High", due: "Wednesday", done: false }
];

const TASKS_FR = [
  { text: "Relancer Marché Vert sur la tarification", priority: "Haute", due: "Aujourd'hui", done: false },
  { text: "Envoyer la proposition à Salon Madeleine", priority: "Moyenne", due: "Demain", done: false },
  { text: "Vérifier les documents d'intégration Clinique Urbaine", priority: "Basse", due: "Vendredi", done: false },
  { text: "Mettre à jour la fiche CRM Bright Logistics", priority: "Moyenne", due: "Aujourd'hui", done: true },
  { text: "Planifier l'appel avec TechFlow SARL", priority: "Haute", due: "Mercredi", done: false }
];

const CUSTOMERS_EN = [
  { name: "Horizon Café", industry: "F&B", since: "Jan 2024", value: "$4,200", status: "Active" },
  { name: "Pacific Imports", industry: "Logistics", since: "Mar 2024", value: "$12,800", status: "Active" },
  { name: "Aurora Beauty", industry: "Beauty", since: "Sep 2023", value: "$3,600", status: "Active" },
  { name: "Summit Consulting", industry: "Consulting", since: "Feb 2024", value: "$7,500", status: "Paused" }
];

const CUSTOMERS_FR = [
  { name: "Horizon Café", industry: "Restauration", since: "Janv. 2024", value: "4 200 $", status: "Actif" },
  { name: "Pacific Imports", industry: "Logistique", since: "Mars 2024", value: "12 800 $", status: "Actif" },
  { name: "Aurora Beauté", industry: "Beauté", since: "Sep. 2023", value: "3 600 $", status: "Actif" },
  { name: "Summit Conseil", industry: "Conseil", since: "Fév. 2024", value: "7 500 $", status: "En pause" }
];

const PRIORITY_COLORS: Record<string, string> = {
  "High": "text-red-400", "Haute": "text-red-400",
  "Medium": "text-yellow-400", "Moyenne": "text-yellow-400",
  "Low": "text-muted", "Basse": "text-muted"
};

export function BusinessDashboardDemo({ locale }: { locale: Locale }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [tasks, setTasks] = useState(locale === "fr" ? TASKS_FR : TASKS_EN);

  const leads = LEADS[locale];
  const customers = locale === "fr" ? CUSTOMERS_FR : CUSTOMERS_EN;

  const tabLabels: Record<Tab, { en: string; fr: string }> = {
    overview: { en: "Overview", fr: "Vue d'ensemble" },
    leads: { en: "Leads", fr: "Prospects" },
    tasks: { en: "Tasks", fr: "Tâches" },
    customers: { en: "Customers", fr: "Clients" }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              {locale === "fr" ? "Dashboard Métier — Démo" : "Business Dashboard — Demo"}
            </p>
            <h3 className="text-base font-bold text-primary mt-0.5">
              {locale === "fr" ? "Tableau de bord de gestion" : "Business Management Dashboard"}
            </h3>
          </div>
          <span className="text-3xl">📊</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {(["overview", "leads", "tasks", "customers"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-semibold shrink-0 transition border-b-2 ${tab === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-primary"}`}
          >
            {tabLabels[t][locale]}
          </button>
        ))}
      </div>

      <div className="p-4 grid gap-4">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {METRICS[locale].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted">{m.label}</p>
                        <p className="mt-1 text-2xl font-black text-primary">{m.value}</p>
                      </div>
                      <div className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent">
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-emerald-400">{m.change}</p>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{locale === "fr" ? "Focus du jour" : "Today's Focus"}</p>
                <ul className="grid gap-2">
                  {tasks.filter((t) => !t.done && (t.due === "Today" || t.due === "Aujourd'hui")).map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className={`mt-0.5 font-bold ${PRIORITY_COLORS[t.priority]}`}>●</span>
                      <span className="text-primary">{t.text}</span>
                    </li>
                  ))}
                  {tasks.filter((t) => !t.done && (t.due === "Today" || t.due === "Aujourd'hui")).length === 0 && (
                    <li className="text-xs text-muted">{locale === "fr" ? "Toutes les tâches d'aujourd'hui sont terminées ✓" : "All today's tasks complete ✓"}</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{locale === "fr" ? "Activité récente" : "Recent Activity"}</p>
                <ul className="grid gap-2 text-xs text-muted">
                  <li>✓ <span className="text-primary">TechFlow Ltd</span> {locale === "fr" ? "marqué comme Gagné" : "marked as Closed Won"}</li>
                  <li>📩 <span className="text-primary">Marché Vert / Green Market</span> {locale === "fr" ? "demande de devis reçue" : "quote request received"}</li>
                  <li>📞 <span className="text-primary">Aurora {locale === "fr" ? "Beauté" : "Beauty"}</span> {locale === "fr" ? "appel planifié — demain" : "call scheduled — tomorrow"}</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {tab === "leads" && (
          <div className="grid gap-2">
            {leads.map((lead) => (
              <div key={lead.name} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-primary truncate">{lead.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STAGE_COLORS[lead.stage] ?? "text-muted bg-muted/10"}`}>{lead.stage}</span>
                    {lead.urgent && <span className="text-xs text-red-400 font-semibold">⚡ Urgent</span>}
                  </div>
                </div>
                <p className="text-sm font-bold text-primary shrink-0">{lead.value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "tasks" && (
          <div className="grid gap-2">
            {tasks.map((task, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl border p-4 transition ${task.done ? "border-emerald-500/20 bg-emerald-500/5 opacity-60" : "border-border bg-background"}`}>
                <button
                  type="button"
                  onClick={() => setTasks((prev) => prev.map((t, j) => j === i ? { ...t, done: !t.done } : t))}
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition ${task.done ? "border-emerald-500 bg-emerald-500" : "border-border hover:border-accent"}`}
                >
                  {task.done && <CheckCircle2 className="size-3 text-white" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${task.done ? "line-through text-muted" : "text-primary"}`}>{task.text}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                    <span className="text-xs text-muted">{locale === "fr" ? "Dû :" : "Due:"} {task.due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "customers" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {customers.map((c) => (
              <div key={c.name} className="rounded-xl border border-border bg-background p-4">
                <p className="font-semibold text-primary">{c.name}</p>
                <p className="text-xs text-muted mt-0.5">{c.industry}</p>
                <div className="mt-3 grid gap-1 text-xs text-muted">
                  <div className="flex justify-between"><span>{locale === "fr" ? "Client depuis" : "Since"}</span><span className="text-primary">{c.since}</span></div>
                  <div className="flex justify-between"><span>{locale === "fr" ? "Valeur totale" : "Lifetime value"}</span><span className="font-bold text-primary">{c.value}</span></div>
                  <div className="flex justify-between"><span>Status</span><span className={c.status === "Active" || c.status === "Actif" ? "text-emerald-400" : "text-yellow-400"}>{c.status}</span></div>
                </div>
              </div>
            ))}
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
