"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { businessInquiryCategories } from "@/content/nexus-site";
import type { Locale } from "@/content/site";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Your name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  company: z.string().trim().max(180).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  inquiryCategory: z.string().trim().min(2, "Choose an inquiry category"),
  message: z.string().trim().min(20, "Please share a little more detail")
});

type QuoteValues = {
  businessName: string;
  industry: string;
  location: string;
  website?: string;
  need: string;
  problem: string;
  serviceType: string;
  budget: string;
  timeline: string;
  name: string;
  email: string;
  whatsapp: string;
  preferredContactMethod: string;
};

type ContactValues = z.infer<typeof contactSchema>;

const quoteFormContent = {
  en: {
    eyebrow: "Project quote",
    title: "Request your digital solution",
    description: "Tell us what is happening in the business and we will recommend the cleanest solution path.",
    stepLabel: "Step",
    ofLabel: "of",
    steps: [
      {
        title: "Business information",
        description: "A little context about the business we are designing for.",
        fields: ["businessName", "industry", "location", "website"] as FieldPath<QuoteValues>[]
      },
      {
        title: "Current problem",
        description: "Help us understand what is not working today.",
        fields: ["problem"] as FieldPath<QuoteValues>[]
      },
      {
        title: "Desired solution",
        description: "Tell us the kind of outcome or system you want to create.",
        fields: ["need", "serviceType"] as FieldPath<QuoteValues>[]
      },
      {
        title: "Budget and timeline",
        description: "We use this to shape the right recommendation and rollout pace.",
        fields: ["budget", "timeline"] as FieldPath<QuoteValues>[]
      },
      {
        title: "Contact details",
        description: "Where we should send the next step and how you prefer to hear from us.",
        fields: ["name", "email", "whatsapp", "preferredContactMethod"] as FieldPath<QuoteValues>[]
      }
    ],
    fields: {
      businessName: "Business name",
      industry: "Industry",
      location: "Location",
      website: "Website or social link",
      problem: "What problem are you trying to solve?",
      need: "What do you need?",
      serviceType: "Service type",
      budget: "Budget range",
      timeline: "Timeline",
      name: "Name",
      email: "Email",
      whatsapp: "WhatsApp number",
      preferredContactMethod: "Preferred contact method"
    },
    placeholders: {
      website: "https://..."
    },
    selects: {
      serviceType: "Select service type",
      budget: "Select budget range",
      timeline: "Select timeline"
    },
    options: {
      serviceTypes: [
        "Premium website",
        "Business management system",
        "Automation workflow",
        "AI-powered tool",
        "Dashboard or reporting layer",
        "Portal or client workspace",
        "Not sure yet"
      ],
      budgetRanges: ["Under $1,000", "$1,000 - $3,000", "$3,000 - $7,500", "$7,500 - $15,000", "$15,000+", "Not sure yet"],
      timelines: ["ASAP", "2-4 weeks", "1-2 months", "3+ months", "Planning stage"],
      preferredContactMethods: ["Email", "WhatsApp", "Phone call"]
    },
    buttons: {
      previous: "Previous",
      continue: "Continue",
      submit: "Submit request"
    },
    success: {
      title: "Thank you. Your digital solution request has been received.",
      body: "We will review the context, identify the most relevant build path, and follow up with the right next step.",
      recommendedPath: "Recommended path",
      pathPreview: [
        "Discovery and solution framing",
        "Scope and delivery recommendation",
        "Launch roadmap and follow-up"
      ]
    },
    validation: {
      businessName: "Business name is required",
      industry: "Industry is required",
      location: "Location is required",
      need: "Tell us what you need",
      problem: "Please describe the problem",
      serviceType: "Select a service type",
      budget: "Select a budget range",
      timeline: "Select a timeline",
      name: "Your name is required",
      email: "Enter a valid email address",
      whatsapp: "WhatsApp number is required",
      preferredContactMethod: "Choose a preferred contact method"
    },
    errors: {
      submit: "We could not submit your request right now. Please try again or contact us directly."
    }
  },
  fr: {
    eyebrow: "Demande de projet",
    title: "Demandez votre solution digitale",
    description: "Expliquez ce qui se passe dans l’entreprise et nous recommanderons le parcours de solution le plus clair.",
    stepLabel: "Étape",
    ofLabel: "sur",
    steps: [
      {
        title: "Informations sur l’entreprise",
        description: "Un peu de contexte sur l’entreprise pour laquelle nous concevons la solution.",
        fields: ["businessName", "industry", "location", "website"] as FieldPath<QuoteValues>[]
      },
      {
        title: "Problème actuel",
        description: "Aidez-nous à comprendre ce qui ne fonctionne pas aujourd’hui.",
        fields: ["problem"] as FieldPath<QuoteValues>[]
      },
      {
        title: "Solution recherchée",
        description: "Décrivez le résultat ou le système que vous souhaitez mettre en place.",
        fields: ["need", "serviceType"] as FieldPath<QuoteValues>[]
      },
      {
        title: "Budget et délai",
        description: "Ces informations nous aident à recommander le bon cadrage et le bon rythme de livraison.",
        fields: ["budget", "timeline"] as FieldPath<QuoteValues>[]
      },
      {
        title: "Coordonnées",
        description: "Où envoyer la prochaine étape et comment vous préférez être contacté.",
        fields: ["name", "email", "whatsapp", "preferredContactMethod"] as FieldPath<QuoteValues>[]
      }
    ],
    fields: {
      businessName: "Nom de l’entreprise",
      industry: "Secteur d’activité",
      location: "Localisation",
      website: "Site web ou lien social",
      problem: "Quel problème cherchez-vous à résoudre ?",
      need: "De quoi avez-vous besoin ?",
      serviceType: "Type de service",
      budget: "Fourchette de budget",
      timeline: "Délai souhaité",
      name: "Nom",
      email: "Adresse e-mail",
      whatsapp: "Numéro WhatsApp",
      preferredContactMethod: "Canal de contact préféré"
    },
    placeholders: {
      website: "https://..."
    },
    selects: {
      serviceType: "Sélectionnez un type de service",
      budget: "Sélectionnez une fourchette",
      timeline: "Sélectionnez un délai"
    },
    options: {
      serviceTypes: [
        "Site web premium",
        "Système de gestion d’entreprise",
        "Workflow d’automatisation",
        "Outil alimenté par l’IA",
        "Tableau de bord ou reporting",
        "Portail ou espace client",
        "Je ne suis pas encore sûr"
      ],
      budgetRanges: ["Moins de 1 000 $", "1 000 $ - 3 000 $", "3 000 $ - 7 500 $", "7 500 $ - 15 000 $", "15 000 $+", "Pas encore sûr"],
      timelines: ["Dès que possible", "2 à 4 semaines", "1 à 2 mois", "3 mois et plus", "Phase de planification"],
      preferredContactMethods: ["Email", "WhatsApp", "Appel téléphonique"]
    },
    buttons: {
      previous: "Précédent",
      continue: "Continuer",
      submit: "Envoyer la demande"
    },
    success: {
      title: "Merci. Votre demande de solution digitale a bien été reçue.",
      body: "Nous allons analyser le contexte, identifier le bon parcours de solution et revenir vers vous avec la prochaine étape la plus pertinente.",
      recommendedPath: "Parcours recommandé",
      pathPreview: [
        "Cadrage et découverte",
        "Recommandation de périmètre et de livraison",
        "Feuille de route de lancement et suivi"
      ]
    },
    validation: {
      businessName: "Le nom de l’entreprise est requis",
      industry: "Le secteur d’activité est requis",
      location: "La localisation est requise",
      need: "Expliquez ce dont vous avez besoin",
      problem: "Veuillez décrire le problème",
      serviceType: "Sélectionnez un type de service",
      budget: "Sélectionnez une fourchette de budget",
      timeline: "Sélectionnez un délai",
      name: "Votre nom est requis",
      email: "Saisissez une adresse e-mail valide",
      whatsapp: "Le numéro WhatsApp est requis",
      preferredContactMethod: "Choisissez un canal de contact"
    },
    errors: {
      submit: "Impossible d’envoyer votre demande pour le moment. Veuillez réessayer ou nous contacter directement."
    }
  }
} as const satisfies Record<Locale, {
  eyebrow: string;
  title: string;
  description: string;
  stepLabel: string;
  ofLabel: string;
  steps: Array<{ title: string; description: string; fields: FieldPath<QuoteValues>[] }>;
  fields: Record<string, string>;
  placeholders: { website: string };
  selects: Record<string, string>;
  options: {
    serviceTypes: string[];
    budgetRanges: string[];
    timelines: string[];
    preferredContactMethods: string[];
  };
  buttons: Record<string, string>;
  success: { title: string; body: string; recommendedPath: string; pathPreview: string[] };
  validation: Record<string, string>;
  errors: { submit: string };
}>;

function createQuoteSchema(copy: (typeof quoteFormContent)[Locale]) {
  return z.object({
    businessName: z.string().trim().min(2, copy.validation.businessName),
    industry: z.string().trim().min(2, copy.validation.industry),
    location: z.string().trim().min(2, copy.validation.location),
    website: z.string().trim().max(240).optional().or(z.literal("")),
    need: z.string().trim().min(6, copy.validation.need),
    problem: z.string().trim().min(20, copy.validation.problem),
    serviceType: z.string().trim().min(2, copy.validation.serviceType),
    budget: z.string().trim().min(2, copy.validation.budget),
    timeline: z.string().trim().min(2, copy.validation.timeline),
    name: z.string().trim().min(2, copy.validation.name),
    email: z.string().trim().email(copy.validation.email),
    whatsapp: z.string().trim().min(6, copy.validation.whatsapp),
    preferredContactMethod: z.string().trim().min(2, copy.validation.preferredContactMethod)
  });
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-600 dark:text-red-300">{message}</p> : null;
}

function getUiLocale() {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function QuoteForm({ locale }: { locale?: Locale }) {
  const resolvedLocale = locale ?? getUiLocale();
  const copy = quoteFormContent[resolvedLocale];
  const quoteSchema = createQuoteSchema(copy);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    trigger,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    mode: "onBlur",
    defaultValues: {
      website: "",
      preferredContactMethod: copy.options.preferredContactMethods[0]
    }
  });

  async function nextStep() {
    const valid = await trigger(copy.steps[step].fields);
    if (valid) setStep((current) => Math.min(current + 1, copy.steps.length - 1));
  }

  async function onSubmit(values: QuoteValues) {
    setSubmitError(null);
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.whatsapp,
      whatsapp: values.whatsapp,
      company: values.businessName,
      country: values.location,
      preferredLanguage: resolvedLocale === "fr" ? "French" : "English",
      businessType: values.industry,
      need: values.need,
      budgetRange: values.budget,
      timeline: values.timeline,
      details: [
        `Current problem: ${values.problem}`,
        `Service type: ${values.serviceType}`,
        `Website or social link: ${values.website || (resolvedLocale === "fr" ? "Non fourni" : "Not provided")}`,
        `Preferred contact method: ${values.preferredContactMethod}`
      ].join("\n\n"),
      consent: true,
      locale: resolvedLocale,
      honeypot: ""
    };

    const response = await fetch("/api/project-inquiry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Try to map server-side field issues back to form fields
      try {
        const json = await response.json();
        if (json?.issues && Array.isArray(json.issues) && json.issues.length > 0) {
          // Map Zod issue paths to QuoteValues field names
          const fieldMap: Record<string, FieldPath<QuoteValues>> = {
            name: "name",
            email: "email",
            phone: "whatsapp",
            whatsapp: "whatsapp",
            company: "businessName",
            country: "location",
            businessType: "industry",
            need: "need",
            budgetRange: "budget",
            timeline: "timeline"
          };
          let mappedAny = false;
          for (const issue of json.issues as Array<{ path: string[]; message: string }>) {
            const key = issue.path[0];
            const formField = key ? fieldMap[key] : undefined;
            if (formField) {
              const fieldStepIndex = copy.steps.findIndex((s) => s.fields.includes(formField));
              if (fieldStepIndex !== -1 && fieldStepIndex !== step) setStep(fieldStepIndex);
              setError(formField, { type: "server", message: issue.message });
              mappedAny = true;
            }
          }
          if (mappedAny) return;
        }
      } catch {
        // JSON parse failed — fall through to generic error
      }
      setSubmitError(copy.errors.submit);
      return;
    }

    setSubmitted(true);
    reset();
    setStep(0);
  }

  return (
    <div className="gradient-border rounded-[1.75rem]">
      <div className="elevated-panel p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">{copy.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              {copy.description}
            </p>
          </div>
          <div className="status-pill rounded-full px-4 py-2 text-sm">
            {copy.stepLabel} {step + 1} {copy.ofLabel} {copy.steps.length}
          </div>
        </div>

        {submitted ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="success-panel rounded-[1.5rem] p-6" role="status" aria-live="polite">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-emerald-500 dark:text-emerald-300" />
                <div>
                  <h3 className="success-copy text-xl font-semibold">{copy.success.title}</h3>
                  <p className="success-copy-muted mt-3 text-sm leading-7">
                    {copy.success.body}
                  </p>
                </div>
              </div>
            </div>
            <div className="subtle-tile rounded-[1.5rem] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">{copy.success.recommendedPath}</p>
              <div className="mt-4 grid gap-3">
                {copy.success.pathPreview.map((item, index) => (
                  <div key={item} className="subtle-tile flex items-center gap-3 rounded-2xl p-3 text-sm text-foreground">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300/14 text-xs font-semibold text-accent dark:text-cyan-200">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form
            className="mt-8"
            onSubmit={handleSubmit(async (values) => {
              await onSubmit(values);
            })}
          >
            <div className="scrollbar-hidden mb-8 flex gap-3 overflow-x-auto pb-1">
              {copy.steps.map((item, index) => (
                <div key={item.title} className="subtle-tile min-w-[11.5rem] rounded-2xl p-3" aria-current={index === step ? "step" : undefined}>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                        index <= step ? "bg-cyan-300/16 text-accent dark:text-cyan-200" : "status-pill text-slate-400"
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className={cn("text-sm font-medium", index <= step ? "text-foreground" : "text-muted")}>{item.title}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-foreground">{copy.steps[step].title}</h3>
              <p className="mt-2 text-sm text-muted">{copy.steps[step].description}</p>
            </div>

            {step === 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="form-label">
                  {copy.fields.businessName}
                  <input className="form-input" autoComplete="organization" {...register("businessName")} />
                  <FieldError message={errors.businessName?.message} />
                </label>
                <label className="form-label">
                  {copy.fields.industry}
                  <input className="form-input" {...register("industry")} />
                  <FieldError message={errors.industry?.message} />
                </label>
                <label className="form-label">
                  {copy.fields.location}
                  <input className="form-input" autoComplete="address-level2" {...register("location")} />
                  <FieldError message={errors.location?.message} />
                </label>
                <label className="form-label">
                  {copy.fields.website}
                  <input className="form-input" inputMode="url" placeholder={copy.placeholders.website} {...register("website")} />
                  <FieldError message={errors.website?.message} />
                </label>
              </div>
            ) : null}

            {step === 1 ? (
              <label className="form-label">
                {copy.fields.problem}
                <textarea className="form-input min-h-48" {...register("problem")} />
                <FieldError message={errors.problem?.message} />
              </label>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="form-label md:col-span-2">
                  {copy.fields.need}
                  <textarea className="form-input min-h-40" {...register("need")} />
                  <FieldError message={errors.need?.message} />
                </label>
                <label className="form-label">
                  {copy.fields.serviceType}
                  <select className="form-input" {...register("serviceType")}>
                    <option value="">{copy.selects.serviceType}</option>
                    {copy.options.serviceTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.serviceType?.message} />
                </label>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="form-label">
                  {copy.fields.budget}
                  <select className="form-input" {...register("budget")}>
                    <option value="">{copy.selects.budget}</option>
                    {copy.options.budgetRanges.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.budget?.message} />
                </label>
                <label className="form-label">
                  {copy.fields.timeline}
                  <select className="form-input" {...register("timeline")}>
                    <option value="">{copy.selects.timeline}</option>
                    {copy.options.timelines.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.timeline?.message} />
                </label>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="form-label">
                  {copy.fields.name}
                  <input className="form-input" autoComplete="name" {...register("name")} />
                  <FieldError message={errors.name?.message} />
                </label>
                <label className="form-label">
                  {copy.fields.email}
                  <input className="form-input" type="email" autoComplete="email" {...register("email")} />
                  <FieldError message={errors.email?.message} />
                </label>
                <label className="form-label">
                  {copy.fields.whatsapp}
                  <input className="form-input" type="tel" autoComplete="tel" {...register("whatsapp")} />
                  <FieldError message={errors.whatsapp?.message} />
                </label>
                <label className="form-label">
                  {copy.fields.preferredContactMethod}
                  <select className="form-input" {...register("preferredContactMethod")}>
                    {copy.options.preferredContactMethods.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.preferredContactMethod?.message} />
                </label>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className={cn("btn-ghost justify-center sm:w-auto", step === 0 && "pointer-events-none opacity-0")}
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
              >
                <ArrowLeft className="size-4" />
                {copy.buttons.previous}
              </button>

              {step < copy.steps.length - 1 ? (
                <button type="button" className="btn-primary w-full sm:w-auto" onClick={nextStep}>
                  {copy.buttons.continue}
                  <ArrowRight className="size-4" />
                </button>
              ) : (
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {copy.buttons.submit}
                </button>
              )}
            </div>
            {submitError ? <p className="mt-4 text-sm text-red-600 dark:text-red-300" role="alert">{submitError}</p> : null}
          </form>
        )}
      </div>
    </div>
  );
}

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: {
      inquiryCategory: businessInquiryCategories[0],
      company: "",
      whatsapp: ""
    }
  });

  async function onSubmit(values: ContactValues) {
    setSubmitError(null);
    const locale = getUiLocale();
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.whatsapp,
      whatsapp: values.whatsapp,
      company: values.company,
      message: `Inquiry category: ${values.inquiryCategory}\n\n${values.message}`,
      locale,
      honeypot: ""
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setSubmitError("We could not send your message right now. Please try again or reach us on WhatsApp.");
      return;
    }

    setSubmitted(true);
    reset();
  }

  return (
    <div className="gradient-border rounded-[1.75rem]">
      <div className="elevated-panel p-6 md:p-8">
        <div>
          <p className="eyebrow">Contact</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground">Start the conversation</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            Share the challenge, the opportunity, or the product idea. We will point you toward the right next step.
          </p>
        </div>

        {submitted ? (
          <div className="success-panel mt-8 rounded-[1.5rem] p-6" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 text-emerald-500 dark:text-emerald-300" />
              <div>
                <h3 className="success-copy text-xl font-semibold">Message received.</h3>
                <p className="success-copy-muted mt-2 text-sm leading-7">
                  Thanks for reaching out. We will review the inquiry and get back to you with a thoughtful next step.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form
            className="mt-8 grid gap-5"
            onSubmit={handleSubmit(async (values) => {
              await onSubmit(values);
            })}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="form-label">
                Name
                <input className="form-input" autoComplete="name" {...register("name")} />
                <FieldError message={errors.name?.message} />
              </label>
              <label className="form-label">
                Email
                <input className="form-input" type="email" autoComplete="email" {...register("email")} />
                <FieldError message={errors.email?.message} />
              </label>
              <label className="form-label">
                Company
                <input className="form-input" autoComplete="organization" {...register("company")} />
                <FieldError message={errors.company?.message} />
              </label>
              <label className="form-label">
                WhatsApp number
                <input className="form-input" type="tel" autoComplete="tel" {...register("whatsapp")} />
                <FieldError message={errors.whatsapp?.message} />
              </label>
            </div>

            <label className="form-label">
              Business inquiry category
              <select className="form-input" {...register("inquiryCategory")}>
                {businessInquiryCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <FieldError message={errors.inquiryCategory?.message} />
            </label>

            <label className="form-label">
              How can we help?
              <textarea className="form-input min-h-40" {...register("message")} />
              <FieldError message={errors.message?.message} />
            </label>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send message
              </button>
            </div>
            {submitError ? <p className="text-sm text-red-600 dark:text-red-300" role="alert">{submitError}</p> : null}
          </form>
        )}
      </div>
    </div>
  );
}
