"use client";

import { Loader2, ShieldCheck, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Locale } from "@/content/site";

type ClaimPack = {
  id: string;
  title: string;
  recommended?: boolean;
};

type ClaimBonusOption = {
  id: string;
  title: string;
  summary: string;
};

export function CourseBonusClaimForm({
  locale,
  packs,
  bonusOptionsByPack,
}: {
  locale: Locale;
  packs: ClaimPack[];
  bonusOptionsByPack: Record<string, ClaimBonusOption[]>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const defaultPackId = packs.find((pack) => pack.recommended)?.id || packs[0]?.id || "";
  const [selectedPackId, setSelectedPackId] = useState(defaultPackId);
  const [selectedBonusIds, setSelectedBonusIds] = useState<string[]>(
    bonusOptionsByPack[defaultPackId]?.map((item) => item.id) || [],
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const availableBonuses = useMemo(
    () => bonusOptionsByPack[selectedPackId] || [],
    [bonusOptionsByPack, selectedPackId],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBonusIds.length) {
      setStatus("error");
      setMessage(
        locale === "fr"
          ? "Selectionnez au moins un document bonus."
          : "Please select at least one bonus file.",
      );
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const formData = new FormData(event.currentTarget);
      formData.delete("requestedBonusIds");
      selectedBonusIds.forEach((bonusId) =>
        formData.append("requestedBonusIds", bonusId),
      );

      const response = await fetch("/api/courses/bonus-claims", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const rawBody = await response.text();
      const payload =
        contentType.includes("application/json") && rawBody
          ? ((JSON.parse(rawBody) as { ok?: boolean; error?: string }) ?? null)
          : null;

      if (response.ok && payload?.ok) {
        setStatus("success");
        setMessage(
          locale === "fr"
            ? "Votre demande de bonus a ete envoyee. L'equipe teChia verifiera votre preuve d'achat avant livraison."
            : "Your bonus claim has been sent. The teChia team will verify your proof of purchase before delivery.",
        );
        formRef.current?.reset();
        setSelectedPackId(defaultPackId);
        setSelectedBonusIds(
          bonusOptionsByPack[defaultPackId]?.map((item) => item.id) || [],
        );
        return;
      }

      setStatus("error");
      setMessage(
        payload?.error ||
          (response.status
            ? locale === "fr"
              ? `La demande a echoue avec le statut ${response.status}.`
              : `The claim request failed with status ${response.status}.`
            : locale === "fr"
              ? "Impossible d'envoyer votre demande pour le moment."
              : "We could not submit your claim right now."),
      );
    } catch {
      setStatus("error");
      setMessage(
        locale === "fr"
          ? "Impossible d'envoyer votre demande pour le moment. Verifiez votre connexion puis reessayez."
          : "We could not submit your claim right now. Please check your connection and try again.",
      );
    }
  }

  function toggleBonusId(bonusId: string) {
    setSelectedBonusIds((current) =>
      current.includes(bonusId)
        ? current.filter((item) => item !== bonusId)
        : [...current, bonusId],
    );
  }

  const copy =
    locale === "fr"
      ? {
          name: "Nom complet",
          email: "Email",
          whatsapp: "WhatsApp",
          pack: "Pack achete",
          orderReference: "Reference Chariow / preuve de paiement",
          purchaseDate: "Date d'achat",
          preferredDelivery: "Mode de livraison prefere",
          emailOnly: "Email",
          whatsappOnly: "WhatsApp",
          both: "Email + WhatsApp",
          proofFile: "Capture ou recu de paiement",
          proofNotes: "Notes de verification",
          proofPlaceholder:
            "Ajoutez tout detail utile sur votre paiement, votre acces, ou votre preuve si necessaire.",
          requestedBonuses: "Documents bonus demandes",
          submit: "Envoyer ma demande de bonus",
          uploading: "Envoi en cours...",
          help:
            "La demande est verifiee manuellement par l'equipe teChia avant l'envoi des ressources.",
        }
      : {
          name: "Full name",
          email: "Email",
          whatsapp: "WhatsApp",
          pack: "Pack purchased",
          orderReference: "Chariow order reference / payment proof",
          purchaseDate: "Purchase date",
          preferredDelivery: "Preferred delivery method",
          emailOnly: "Email",
          whatsappOnly: "WhatsApp",
          both: "Email + WhatsApp",
          proofFile: "Payment screenshot or receipt",
          proofNotes: "Verification notes",
          proofPlaceholder:
            "Add any useful detail about your payment, access, or proof if needed.",
          requestedBonuses: "Requested bonus files",
          submit: "Submit my bonus claim",
          uploading: "Submitting...",
          help:
            "Claims are reviewed manually by the teChia team before bonus resources are delivered.",
        };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[1.85rem] border border-border bg-surface p-6 sm:p-7"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.name}
          <input name="name" required className="form-input" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.email}
          <input name="email" required type="email" className="form-input" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.whatsapp}
          <input name="whatsapp" type="tel" className="form-input" placeholder="+237..." />
        </label>
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.pack}
          <select
            name="coursePackId"
            required
            className="form-input"
            value={selectedPackId}
            onChange={(event) => {
              const nextPackId = event.target.value;
              setSelectedPackId(nextPackId);
              setSelectedBonusIds(
                (bonusOptionsByPack[nextPackId] || []).map((item) => item.id),
              );
            }}
          >
            {packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.orderReference}
          <input name="orderReference" required className="form-input" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.purchaseDate}
          <input name="purchaseDate" type="date" className="form-input" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-primary md:col-span-2">
          {copy.preferredDelivery}
          <select name="preferredDelivery" defaultValue="EMAIL" className="form-input">
            <option value="EMAIL">{copy.emailOnly}</option>
            <option value="WHATSAPP">{copy.whatsappOnly}</option>
            <option value="BOTH">{copy.both}</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.proofFile}
          <div className="rounded-[1.2rem] border border-dashed border-cyan-500/30 bg-cyan-500/[0.04] p-4">
            <div className="flex items-center gap-3 text-sm text-muted">
              <Upload className="size-4 text-cyan-400" />
              <span>
                {locale === "fr"
                  ? "Ajoutez un fichier image ou PDF si vous en avez un."
                  : "Add an image or PDF file if you have one."}
              </span>
            </div>
            <input
              name="proofFile"
              type="file"
              accept=".pdf,image/*"
              className="mt-4 block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:font-medium file:text-white"
            />
          </div>
        </label>

        <label className="grid gap-2 text-sm font-medium text-primary">
          {copy.proofNotes}
          <textarea
            name="proofNotes"
            className="form-input min-h-28"
            placeholder={copy.proofPlaceholder}
          />
        </label>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-cyan-400" />
          <p className="text-sm font-medium text-primary">
            {copy.requestedBonuses}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {availableBonuses.map((bonus) => (
            <label
              key={bonus.id}
              className="flex items-start gap-3 rounded-[1.15rem] border border-border bg-background/70 p-4"
            >
              <input
                type="checkbox"
                checked={selectedBonusIds.includes(bonus.id)}
                onChange={() => toggleBonusId(bonus.id)}
                className="mt-1 size-4 rounded border-border"
              />
              <div>
                <p className="text-sm font-semibold text-primary">{bonus.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{bonus.summary}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <input type="hidden" name="locale" value={locale} />
      <input
        type="hidden"
        name="sourcePage"
        value={locale === "fr" ? "course_bonus_claim_page_fr" : "course_bonus_claim_page_en"}
      />
      <input className="hidden" type="text" name="honeypot" tabIndex={-1} autoComplete="off" />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary w-full justify-center gap-2 sm:w-auto"
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          {status === "loading" ? copy.uploading : copy.submit}
        </button>
        <p className="text-sm text-muted">{copy.help}</p>
      </div>

      {message ? (
        <div
          className={
            status === "success"
              ? "rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
              : "rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
          }
          role={status === "success" ? "status" : "alert"}
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}
