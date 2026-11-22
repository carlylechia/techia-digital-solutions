"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";
import type {
  SocialGraphicFormat,
  SocialPlatform,
} from "@/lib/ai/social-share-types";
import {
  formatMetaDate,
  isMetaActivePublication,
  metaAccountPlatformLabel,
  metaPublicationLabel,
  metaPublicationTone,
  type MetaOverviewDto,
  type MetaPublicationDto,
} from "./meta-ui";

type Graphic = {
  id: string;
  format: SocialGraphicFormat;
  width: number;
  height: number;
};

type Props = {
  postId: string;
  platform: SocialPlatform;
  articleStatus: string;
  savedCaption: string;
  captionDraft: string;
  graphics: Graphic[];
  revision: number;
};

function normalizeCaption(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  return `key_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function MetaPublishPanel({
  postId,
  platform,
  articleStatus,
  savedCaption,
  captionDraft,
  graphics,
  revision,
}: Props) {
  const supported = platform === "FACEBOOK" || platform === "INSTAGRAM";
  const [overview, setOverview] = useState<MetaOverviewDto | null>(null);
  const [publications, setPublications] = useState<MetaPublicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [accountChoice, setAccountChoice] = useState("");
  const [graphicChoice, setGraphicChoice] = useState<string>("none");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [lastPublication, setLastPublication] =
    useState<MetaPublicationDto | null>(null);

  const loadMeta = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const [statusRes, historyRes] = await Promise.all([
          fetch("/api/meta/status", {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch(
            `/api/meta/publications?postId=${encodeURIComponent(postId)}&limit=20`,
            {
              credentials: "same-origin",
              cache: "no-store",
            },
          ),
        ]);
        const [statusJson, historyJson] = await Promise.all([
          statusRes.json(),
          historyRes.json(),
        ]);
        if (!statusRes.ok || !statusJson.ok)
          throw new Error(
            statusJson.error || "Could not load the Meta publishing status.",
          );
        if (!historyRes.ok || !historyJson.ok)
          throw new Error(
            historyJson.error || "Could not load the publication history.",
          );
        setOverview(statusJson as MetaOverviewDto);
        setPublications(
          Array.isArray(historyJson.publications)
            ? (historyJson.publications as MetaPublicationDto[])
            : [],
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Could not load direct publishing data.",
        );
      } finally {
        setLoading(false);
      }
    },
    [postId],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMeta();
  }, [loadMeta, revision, platform]);

  const destinations = (overview?.connection?.accounts || []).filter(
    (account) =>
      account.isEligible &&
      account.healthStatus !== "TOKEN_REVOKED" &&
      account.healthStatus !== "TOKEN_EXPIRED" &&
      account.healthStatus !== "DISCONNECTED" &&
      ((platform === "FACEBOOK" && account.platform === "FACEBOOK_PAGE") ||
        (platform === "INSTAGRAM" && account.platform === "INSTAGRAM")),
  );
  const destination =
    destinations.find((account) => account.id === accountChoice) ||
    destinations[0] ||
    null;
  const squareGraphic =
    graphics.find((graphic) => graphic.format === "SQUARE") || null;
  const effectiveGraphicId =
    platform === "INSTAGRAM"
      ? squareGraphic?.id || null
      : graphicChoice !== "none" &&
          graphics.some((graphic) => graphic.id === graphicChoice)
        ? graphicChoice
        : null;

  const normalizedSaved = normalizeCaption(savedCaption);
  const hasUnsavedCaption = normalizeCaption(captionDraft) !== normalizedSaved;
  const articlePublic = articleStatus === "PUBLISHED";
  const activePublication =
    publications.find(
      (publication) =>
        isMetaActivePublication(publication.status) &&
        publication.platform === platform &&
        (!destination ||
          publication.destinationAccountId === destination.platformAccountId),
    ) || null;
  const publishedDuplicate =
    publications.find(
      (publication) =>
        publication.status === "PUBLISHED" &&
        publication.platform === platform &&
        (!destination ||
          publication.destinationAccountId === destination.platformAccountId) &&
        normalizeCaption(publication.caption) === normalizedSaved,
    ) || null;
  const captionTooLong =
    platform === "INSTAGRAM" && normalizedSaved.length > 2200;
  const missingInstagramGraphic = platform === "INSTAGRAM" && !squareGraphic;
  const armed = Boolean(overview?.publishingEnabled);
  const canPublish =
    supported &&
    armed &&
    articlePublic &&
    Boolean(destination) &&
    normalizedSaved.length > 0 &&
    !hasUnsavedCaption &&
    !captionTooLong &&
    !missingInstagramGraphic &&
    !activePublication;

  const blockReason = !supported
    ? "Direct publishing is available for Facebook and Instagram only. Use the manual copy and share tools for WhatsApp."
    : loading && !overview
      ? "Loading the Meta publishing status…"
      : !articlePublic
        ? "Publish the article first. Direct publishing refuses to promote an article that is not publicly available."
        : !overview?.configured
          ? "Meta is not fully configured on the server. See the Meta connection settings above."
          : !armed
            ? "Direct publishing is currently blocked by the two-level kill switch. See the Meta connection settings above."
            : !destination
              ? "No eligible destination is connected for this platform. Connect one in the Meta settings above."
              : hasUnsavedCaption
                ? "You have unsaved caption edits in the editor above. Save them first: direct publishing uses the saved caption, never the unsaved draft."
                : !normalizedSaved
                  ? "Generate and save a caption for this platform first."
                  : captionTooLong
                    ? "This Instagram caption exceeds 2,200 characters. Shorten and save it before publishing."
                    : missingInstagramGraphic
                      ? "Instagram feed publishing requires the square branded graphic. Generate it in the graphics section first."
                      : activePublication
                        ? "A publication to this destination is still active or unresolved. Check its status in the history below before publishing again."
                        : publishedDuplicate
                          ? "This exact content is already published to this destination. Open the existing post from the history instead of publishing again."
                          : null;

  function openConfirmation() {
    if (!canPublish) return;
    setError(null);
    setNotice(null);
    setPendingKey((current) => current || newIdempotencyKey());
    setConfirmOpen(true);
  }

  function cancelConfirmation() {
    setConfirmOpen(false);
    setPendingKey(null);
  }

  async function publishNow() {
    if (!destination || !pendingKey) return;
    setBusy("publish");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/meta/publications", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          platform,
          connectedAccountId: destination.id,
          graphicId: effectiveGraphicId,
          idempotencyKey: pendingKey,
          confirm: true,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        // A 5xx or an interrupted response may have reached Meta. Keep the
        // idempotency key so a retry can never create a second post.
        if (res.status < 500) setPendingKey(null);
        setConfirmOpen(false);
        await loadMeta(true);
        throw new Error(
          json?.error ||
            "The publication result could not be confirmed. Check the history before retrying.",
        );
      }

      const publication = json.publication as MetaPublicationDto;
      setLastPublication(publication);
      setConfirmOpen(false);
      setPendingKey(null);
      if (publication.status === "PUBLISHED") {
        setNotice(
          json.replayed
            ? "This publication was already recorded. No duplicate post was created."
            : `Published to ${publication.destinationName || "the selected destination"}.`,
        );
      } else if (publication.status === "UNKNOWN_RESULT") {
        setNotice(null);
        setError(
          publication.lastErrorMessage ||
            "Meta did not confirm the result. The publication is locked until it is reconciled.",
        );
      } else if (publication.status === "PROCESSING") {
        setNotice(
          "Meta is still processing the Instagram media. Use “Check status” below; do not start another publication.",
        );
      } else if (
        publication.status === "FAILED" ||
        publication.status === "REQUIRES_REAUTHORIZATION"
      ) {
        setNotice(null);
        setError(
          publication.lastErrorMessage || "Meta did not publish this content.",
        );
      } else {
        setNotice(
          `Publication status: ${metaPublicationLabel(publication.status)}.`,
        );
      }
      await loadMeta(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The publication request was interrupted. Check the history before retrying.",
      );
      await loadMeta(true);
    } finally {
      setBusy(null);
    }
  }

  async function resolvePublication(
    publication: MetaPublicationDto,
    action: "check" | "confirm_published" | "mark_failed",
  ) {
    let externalUrl: string | undefined;
    if (action === "confirm_published") {
      const entered = window.prompt(
        "Paste the public URL of the post you verified on the destination. Leave blank only if you are certain the post exists.",
        publication.externalUrl || "",
      );
      if (entered === null) return;
      externalUrl = entered.trim() || undefined;
      if (
        !window.confirm(
          "Confirm that this content is publicly published? This marks the publication as complete and releases the lock.",
        )
      )
        return;
    }
    if (action === "mark_failed") {
      if (
        !window.confirm(
          "Mark this publication as failed because you verified that no post exists? This releases the lock so a new confirmed publication can be started.",
        )
      ) {
        return;
      }
    }

    setBusy(`resolve-${publication.id}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/meta/publications/${encodeURIComponent(publication.id)}`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, externalUrl }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Could not update this publication.");
      setNotice(
        action === "check"
          ? `Status checked: ${metaPublicationLabel(json.publication.status)}.`
          : action === "confirm_published"
            ? "Publication confirmed as published."
            : "Publication marked as failed. No post was created.",
      );
      await loadMeta(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update this publication.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (!supported) {
    return (
      <div className="premium-card p-5 grid gap-2">
        <h2 className="text-sm font-semibold text-primary">
          Direct publishing
        </h2>
        <p className="text-xs text-muted">
          Direct publishing is available for Facebook Pages and Instagram
          professional accounts. Use the manual copy, download and share tools
          above for WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div id="meta-publish" className="premium-card p-5 grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-primary">
            Direct publishing to{" "}
            {platform === "FACEBOOK" ? "Facebook" : "Instagram"}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Uses the saved {platform === "FACEBOOK" ? "Facebook" : "Instagram"}{" "}
            caption and the selected graphic. Nothing is published
            automatically.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => void loadMeta()}
          disabled={busy !== null || loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}{" "}
          Refresh
        </button>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="form-label text-xs">
            Destination
            <select
              className="form-input text-sm"
              value={destination?.id || ""}
              onChange={(event) => {
                setAccountChoice(event.target.value);
                setConfirmOpen(false);
                setPendingKey(null);
              }}
              disabled={
                loading ||
                destinations.length === 0 ||
                busy !== null ||
                confirmOpen
              }
            >
              {destinations.length === 0 ? (
                <option value="">
                  No eligible{" "}
                  {platform === "FACEBOOK" ? "Page" : "Instagram account"}{" "}
                  connected
                </option>
              ) : null}
              {destinations.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName}
                  {account.username ? ` (@${account.username})` : ""}
                  {account.platform === "INSTAGRAM" && account.pageName
                    ? ` · via ${account.pageName}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] text-muted">
            {destination ? (
              <>
                {metaAccountPlatformLabel[destination.platform]} · last checked{" "}
                {formatMetaDate(destination.lastHealthCheckAt)}
              </>
            ) : (
              <>
                Manage the connection in the Meta settings above.{" "}
                <a
                  href="#meta-connection"
                  className="text-accent hover:underline"
                >
                  Open Meta settings
                </a>
              </>
            )}
          </p>

          {platform === "FACEBOOK" ? (
            <label className="form-label text-xs">
              Media
              <select
                className="form-input text-sm"
                value={graphicChoice}
                onChange={(event) => {
                  setGraphicChoice(event.target.value);
                  setConfirmOpen(false);
                  setPendingKey(null);
                }}
                disabled={loading || busy !== null || confirmOpen}
              >
                <option value="none">Text and article link only</option>
                {squareGraphic ? (
                  <option value={squareGraphic.id}>
                    Square branded graphic
                  </option>
                ) : null}
              </select>
            </label>
          ) : (
            <div className="rounded-lg border border-border bg-surface/40 p-2.5">
              <p className="text-[11px] font-semibold text-primary">Media</p>
              <p className="text-[11px] text-muted">
                {squareGraphic
                  ? "The square 1080×1080 branded graphic will be converted to a JPEG derivative for Instagram feed publishing."
                  : "No square graphic exists yet. Generate it in the graphics section above."}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <div className="rounded-lg border border-border bg-surface/40 p-2.5">
            <p className="text-[11px] font-semibold text-primary">
              Saved caption that will be published
            </p>
            <p className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words text-[11px] text-muted">
              {normalizedSaved || "No saved caption yet."}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {normalizedSaved.length.toLocaleString()} characters
              {platform === "INSTAGRAM" ? " / 2,200 maximum" : ""}
            </p>
          </div>
          {hasUnsavedCaption ? (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
              The editor draft differs from the saved caption. Save your edits
              above before publishing. The draft is never sent to Meta.
            </p>
          ) : null}
          {platform === "INSTAGRAM" && squareGraphic ? (
            <div className="rounded-lg border border-border bg-surface/40 p-2.5">
              <p className="text-[11px] font-semibold text-primary">
                Instagram media eligibility
              </p>
              <p className="text-[11px] text-muted">
                Square {squareGraphic.width}×{squareGraphic.height} · JPEG
                derivative · single-image feed post only. Stories, Reels, video
                and carousels are intentionally unsupported.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {blockReason ? (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          <Lock className="mt-0.5 size-3.5 shrink-0" /> {blockReason}
        </p>
      ) : null}

      {activePublication ? (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-200">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="size-3.5" /> Active publication:{" "}
            {metaPublicationLabel(activePublication.status)}
          </p>
          <p className="mt-1">
            Started {formatMetaDate(activePublication.startedAt)}. Publishing is
            locked for this content and destination until this result is
            reconciled or resolved. No automatic retry will run.
          </p>
        </div>
      ) : null}

      {lastPublication?.status === "PUBLISHED" &&
      lastPublication.externalUrl ? (
        <a
          href={lastPublication.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-xs text-accent hover:underline"
        >
          <ExternalLink className="size-3.5" /> Open the published post
        </a>
      ) : null}

      {!confirmOpen ? (
        <button
          type="button"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-[#001018] disabled:opacity-50"
          onClick={openConfirmation}
          disabled={!canPublish || busy !== null}
        >
          {busy === "publish" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}{" "}
          Review & publish
        </button>
      ) : (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 grid gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-200">
            <AlertTriangle className="size-4" /> Confirm public publication
          </p>
          <p className="text-[11px] text-amber-100">
            This will immediately create a live post. It will not be scheduled
            or retried automatically, and this app cannot undo it from here.
          </p>
          <dl className="grid gap-1 text-[11px] text-amber-100/90">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-semibold">Destination</dt>
              <dd>{destination?.displayName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-semibold">Media</dt>
              <dd>
                {platform === "INSTAGRAM"
                  ? "Single square image (JPEG derivative)"
                  : effectiveGraphicId
                    ? "Square branded graphic"
                    : "Text and article link only"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-semibold">Caption</dt>
              <dd className="line-clamp-3 whitespace-pre-wrap break-words">
                {normalizedSaved}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#001018] disabled:opacity-50"
              onClick={() => void publishNow()}
              disabled={busy !== null || !destination || !pendingKey}
            >
              {busy === "publish" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}{" "}
              Yes, publish now
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={cancelConfirmation}
              disabled={busy !== null}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-3 grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-primary">
            Direct publication history
          </h3>
          <p className="text-[10px] text-muted">
            Shared SuperAdmin audit history · no automatic retries
          </p>
        </div>
        {loading && publications.length === 0 ? (
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <Loader2 className="size-3.5 animate-spin" /> Loading history…
          </div>
        ) : publications.length === 0 ? (
          <p className="text-[11px] text-muted">
            No direct publications recorded for this article yet.
          </p>
        ) : (
          <div className="grid gap-2">
            {publications.slice(0, 8).map((publication) => (
              <div
                key={publication.id}
                className="rounded-lg border border-border bg-surface/40 p-2.5 grid gap-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${metaPublicationTone(publication.status)}`}
                    >
                      {metaPublicationLabel(publication.status)}
                    </span>
                    <span className="text-[11px] font-semibold text-primary">
                      {publication.platform === "FACEBOOK"
                        ? "Facebook"
                        : publication.platform === "INSTAGRAM"
                          ? "Instagram"
                          : publication.platform}
                    </span>
                    <span className="text-[11px] text-muted">
                      → {publication.destinationName || "Unknown destination"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted">
                    {formatMetaDate(
                      publication.publishedAt || publication.startedAt,
                    )}
                  </span>
                </div>
                {publication.externalUrl ? (
                  <a
                    href={publication.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-1 text-[11px] text-accent hover:underline"
                  >
                    <ExternalLink className="size-3" /> Open post
                  </a>
                ) : null}
                {publication.lastErrorMessage ? (
                  <p className="text-[11px] text-amber-300">
                    {publication.lastErrorMessage}
                  </p>
                ) : null}
                <p className="text-[10px] text-muted">
                  {publication.attemptCount} provider attempt
                  {publication.attemptCount === 1 ? "" : "s"}
                  {publication.initiatedBy
                    ? ` · started by ${publication.initiatedBy}`
                    : ""}
                  {publication.reconciliationAttemptedAt
                    ? ` · last checked ${formatMetaDate(publication.reconciliationAttemptedAt)}`
                    : ""}
                </p>
                {publication.canReconcile || publication.canResolve ? (
                  <div className="flex flex-wrap gap-2">
                    {publication.canReconcile ? (
                      <button
                        type="button"
                        className="btn-secondary text-[11px]"
                        onClick={() =>
                          void resolvePublication(publication, "check")
                        }
                        disabled={busy !== null}
                      >
                        {busy === `resolve-${publication.id}` ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <RefreshCw className="size-3" />
                        )}{" "}
                        Check status
                      </button>
                    ) : null}
                    {publication.canResolve ? (
                      <>
                        <button
                          type="button"
                          className="btn-secondary text-[11px]"
                          onClick={() =>
                            void resolvePublication(
                              publication,
                              "confirm_published",
                            )
                          }
                          disabled={busy !== null}
                        >
                          <CheckCircle2 className="size-3" /> Confirm published
                        </button>
                        <button
                          type="button"
                          className="btn-ghost text-[11px] text-red-300"
                          onClick={() =>
                            void resolvePublication(publication, "mark_failed")
                          }
                          disabled={busy !== null}
                        >
                          Mark failed
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
