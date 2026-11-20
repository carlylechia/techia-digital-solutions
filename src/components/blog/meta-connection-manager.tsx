"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import type { BlogLocale } from "@/lib/blog/constants";
import {
  formatMetaDate,
  metaAccountPlatformLabel,
  metaConnectionLabel,
  metaConnectionTone,
  metaHealthLabel,
  metaHealthTone,
  type MetaDiscoveryDto,
  type MetaOverviewDto,
} from "./meta-ui";

type Props = {
  locale: BlogLocale;
  initialNotice?: string | null;
  initialReason?: string | null;
  onChanged?: () => void;
};

function initialMessage(notice?: string | null, reason?: string | null) {
  if (notice === "connected") {
    return "Meta connected. Discover and select the Facebook Pages or Instagram accounts you want this app to publish to.";
  }
  if (notice === "permissions") {
    return "Meta connected, but one or more required permissions were not granted. Reconnect and approve every permission so direct publishing can work.";
  }
  if (notice === "error") {
    switch (reason) {
      case "rate_limited":
        return "Too many Meta connection attempts. Wait a minute and try again.";
      case "configuration":
        return "Meta is not fully configured on the server. Check the configuration checklist below.";
      case "state_missing":
      case "state_invalid":
      case "state_expired":
      case "state_replayed":
        return "The Meta sign-in request expired or was already used. Start the connection again.";
      case "state_wrong_admin":
        return "This Meta sign-in request belongs to a different administrator. Start a new connection from your own session.";
      case "access_denied":
        return "Meta authorization was cancelled or denied. Nothing was connected.";
      case "wrong_app":
        return "Meta returned a token that does not belong to this application. Check META_APP_ID and META_APP_SECRET.";
      case "not_configured":
      case "token_exchange_failed":
      case "invalid_token":
      case "provider_error":
        return "Meta could not complete the connection. No credential was stored. Try again, then check the server logs if it persists.";
      default:
        return "The Meta connection could not be completed. Nothing was changed.";
    }
  }
  return null;
}

function platformKey(platform: "FACEBOOK_PAGE" | "INSTAGRAM", id: string) {
  return `${platform}:${id}`;
}

export function MetaConnectionManager({
  locale,
  initialNotice,
  initialReason,
  onChanged,
}: Props) {
  const [overview, setOverview] = useState<MetaOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(() =>
    initialMessage(initialNotice, initialReason),
  );
  const [open, setOpen] = useState(true);
  const [discovery, setDiscovery] = useState<MetaDiscoveryDto | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionResult, setSelectionResult] = useState<{
    saved: number;
    skipped: Array<{ platform: string; reason: string }>;
  } | null>(null);

  useEffect(() => {
    if (!initialNotice && !initialReason) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("meta");
    url.searchParams.delete("reason");
    window.history.replaceState({}, "", url.toString());
  }, [initialNotice, initialReason]);

  const loadOverview = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/meta/status", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(
          json.error || "Could not load the Meta connection status.",
        );
      setOverview(json as MetaOverviewDto);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load the Meta connection status.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOverview();
  }, [loadOverview]);

  const runDiscovery = useCallback(async (connectionId: string) => {
    setBusy("discovery");
    setError(null);
    setSelectionResult(null);
    try {
      const res = await fetch(
        `/api/meta/accounts?connectionId=${encodeURIComponent(connectionId)}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Could not discover Meta accounts.");
      setDiscovery(json as MetaDiscoveryDto);
      setSelected(new Set());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not discover Meta accounts.",
      );
    } finally {
      setBusy(null);
    }
  }, []);

  async function refreshHealth() {
    if (!overview?.connection) return;
    setBusy("health");
    setError(null);
    try {
      const res = await fetch("/api/meta/accounts/health", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: overview.connection.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "The Meta health check failed.");
      setOverview((current) =>
        current ? { ...current, connection: json.connection } : current,
      );
      setNotice("Meta connection health refreshed.");
      onChanged?.();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The Meta health check failed.",
      );
      await loadOverview(true);
    } finally {
      setBusy(null);
    }
  }

  async function saveSelection() {
    if (!overview?.connection || selected.size === 0) return;
    setBusy("selection");
    setError(null);
    setNotice(null);
    try {
      const accounts = Array.from(selected).map((key) => {
        const separator = key.indexOf(":");
        return {
          platform: key.slice(0, separator) as "FACEBOOK_PAGE" | "INSTAGRAM",
          platformAccountId: key.slice(separator + 1),
        };
      });
      const res = await fetch("/api/meta/accounts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: overview.connection.id,
          accounts,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(
          json.error || "Could not connect the selected accounts.",
        );
      setSelectionResult({
        saved: Array.isArray(json.accounts) ? json.accounts.length : 0,
        skipped: json.skipped || [],
      });
      setNotice("Selected Meta destinations saved.");
      await loadOverview(true);
      await runDiscovery(overview.connection.id);
      onChanged?.();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not connect the selected accounts.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function disconnectAccount(id: string, name: string) {
    if (
      !window.confirm(
        `Disconnect “${name}” from direct publishing? Existing publication history is preserved.`,
      )
    )
      return;
    setBusy(`account-${id}`);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/meta/accounts/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Could not disconnect this account.");
      setNotice(`“${name}” disconnected.`);
      setDiscovery(null);
      await loadOverview(true);
      onChanged?.();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not disconnect this account.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function disconnectConnection() {
    if (!overview?.connection) return;
    if (
      !window.confirm(
        "Disconnect this entire Meta connection? The stored user token will be deleted and all connected Pages and Instagram accounts will be unavailable for direct publishing. Publication history is preserved.",
      )
    ) {
      return;
    }
    setBusy("connection");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/meta/connection", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: overview.connection.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Could not disconnect Meta.");
      setDiscovery(null);
      setNotice("Meta disconnected. No stored Meta credential remains active.");
      await loadOverview(true);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disconnect Meta.");
    } finally {
      setBusy(null);
    }
  }

  async function togglePublishing(next: boolean) {
    if (
      next &&
      !window.confirm(
        "Enable direct publishing? Every post still requires a separate human confirmation. This switch can be turned off again at any time.",
      )
    ) {
      return;
    }
    setBusy("settings");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/meta/settings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishingEnabled: next }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(
          json.error || "Could not update the publishing switch.",
        );
      setOverview(json as MetaOverviewDto);
      setNotice(
        next
          ? "Direct publishing enabled in the application settings."
          : "Direct publishing paused in the application settings.",
      );
      onChanged?.();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not update the publishing switch.",
      );
      await loadOverview(true);
    } finally {
      setBusy(null);
    }
  }

  function toggleSelection(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const connection = overview?.connection || null;
  const eligibleAccounts =
    connection?.accounts.filter((account) => account.isEligible) || [];
  const armed = Boolean(overview?.publishingEnabled);

  return (
    <section id="meta-connection" className="premium-card p-4 grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-primary">
              Direct publishing (Meta)
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Connect a Facebook Page or its linked Instagram professional
              account. Publishing is always manual and individually confirmed.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              armed
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
            }`}
          >
            {armed ? (
              <CheckCircle2 className="size-3" />
            ) : (
              <AlertTriangle className="size-3" />
            )}
            {armed
              ? "Armed — confirmation still required"
              : "Publishing blocked"}
          </span>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Hide settings" : "Manage connection"}
          </button>
        </div>
      </div>

      {loading && !overview ? (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Loader2 className="size-3.5 animate-spin" /> Loading Meta status…
        </div>
      ) : null}

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

      {open && overview ? (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface/40 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Meta app & encryption
              </p>
              <p
                className={`mt-1 text-xs font-semibold ${overview.configured ? "text-emerald-300" : "text-amber-300"}`}
              >
                {overview.configured ? "Configured" : "Action required"}
              </p>
              {!overview.encryptionKeyConfigured ? (
                <p className="mt-1 text-[11px] text-amber-300">
                  META_TOKEN_ENCRYPTION_KEY is missing or invalid.
                </p>
              ) : null}
            </div>
            <div className="rounded-lg border border-border bg-surface/40 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Graph API version
              </p>
              <p className="mt-1 font-mono text-xs font-semibold text-primary">
                {overview.graphVersion}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Pinned on every request.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/40 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Environment kill switch
              </p>
              <p
                className={`mt-1 text-xs font-semibold ${overview.envPublishingEnabled ? "text-emerald-300" : "text-amber-300"}`}
              >
                {overview.envPublishingEnabled
                  ? "META_PUBLISHING_ENABLED=true"
                  : "Blocked"}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {overview.envPublishingEnabled
                  ? "The server switch allows publishing, subject to the app switch below."
                  : "Set META_PUBLISHING_ENABLED to exactly true on the server to allow any publishing."}
              </p>
            </div>
          </div>

          {!overview.configured ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              Server configuration is incomplete. Set META_APP_ID,
              META_APP_SECRET, META_OAUTH_REDIRECT_URI and
              META_TOKEN_ENCRYPTION_KEY, then restart the app. See
              docs/meta-business-connection.md.
            </p>
          ) : null}

          <div className="rounded-xl border border-border bg-surface-strong/30 p-3 grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-primary">
                  Meta authorization
                </p>
                {connection ? (
                  <p className="text-[11px] text-muted">
                    {connection.metaUserName || "Meta user"} · connected{" "}
                    {formatMetaDate(connection.connectedAt)} · last checked{" "}
                    {formatMetaDate(connection.lastHealthCheckAt)}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted">
                    No Meta authorization is stored for your administrator
                    account.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {connection ? (
                  <>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${metaConnectionTone(connection.status)}`}
                    >
                      {metaConnectionLabel(connection.status)}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => void refreshHealth()}
                      disabled={busy !== null}
                    >
                      {busy === "health" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}{" "}
                      Refresh status
                    </button>
                    <a
                      href={`/api/meta/oauth/start?locale=${locale}`}
                      className="btn-secondary text-xs"
                    >
                      <Link2 className="size-3.5" /> Reconnect
                    </a>
                    <button
                      type="button"
                      className="btn-ghost text-xs text-red-300"
                      onClick={() => void disconnectConnection()}
                      disabled={busy !== null}
                    >
                      {busy === "connection" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Unplug className="size-3.5" />
                      )}{" "}
                      Disconnect
                    </button>
                  </>
                ) : (
                  <a
                    href={`/api/meta/oauth/start?locale=${locale}`}
                    className="btn-secondary text-xs"
                  >
                    <Link2 className="size-3.5" /> Connect Meta
                  </a>
                )}
              </div>
            </div>

            {connection?.healthMessage ? (
              <p className="text-[11px] text-amber-300">
                {connection.healthMessage}
              </p>
            ) : null}
            {connection ? (
              <p className="text-[11px] text-muted">
                User token:{" "}
                {connection.tokenExpiresAt
                  ? `expires ${formatMetaDate(connection.tokenExpiresAt)}`
                  : "no fixed expiry reported"}{" "}
                · Data access:{" "}
                {connection.dataAccessExpiresAt
                  ? formatMetaDate(connection.dataAccessExpiresAt)
                  : "not reported"}
              </p>
            ) : null}
          </div>

          {connection ? (
            <div className="rounded-xl border border-border bg-surface-strong/30 p-3 grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-primary">
                  Connected destinations
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary text-[11px]"
                    onClick={() => void runDiscovery(connection.id)}
                    disabled={busy !== null}
                  >
                    {busy === "discovery" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    {connection.accounts.length
                      ? "Discover more"
                      : "Discover Pages & Instagram"}
                  </button>
                </div>
              </div>

              {connection.accounts.length ? (
                <div className="grid gap-2">
                  {connection.accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-surface/40 p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary">
                          {account.displayName}{" "}
                          <span className="font-normal text-muted">
                            · {metaAccountPlatformLabel[account.platform]}
                          </span>
                        </p>
                        <p className="text-[11px] text-muted">
                          {account.platform === "INSTAGRAM" && account.pageName
                            ? `Linked to Page: ${account.pageName}`
                            : account.username
                              ? `@${account.username}`
                              : account.pageName || "Facebook Page"}
                        </p>
                        {!account.isEligible ? (
                          <p className="text-[11px] text-amber-300">
                            {account.ineligibilityReason ||
                              "Not eligible for publishing."}
                          </p>
                        ) : null}
                        {account.healthMessage && account.isEligible ? (
                          <p className="text-[11px] text-amber-300">
                            {account.healthMessage}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${metaHealthTone(account.healthStatus)}`}
                        >
                          {metaHealthLabel(account.healthStatus)}
                        </span>
                        <button
                          type="button"
                          className="btn-ghost p-1 text-red-300"
                          onClick={() =>
                            void disconnectAccount(
                              account.id,
                              account.displayName,
                            )
                          }
                          disabled={busy !== null}
                          aria-label={`Disconnect ${account.displayName}`}
                        >
                          {busy === `account-${account.id}` ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Unplug className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted">
                  No destinations are connected yet. Use “Discover Pages &
                  Instagram” and select at least one eligible account.
                </p>
              )}

              {discovery ? (
                <div className="grid gap-2 border-t border-border pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-primary">
                      Available destinations
                    </p>
                    <p className="text-[11px] text-muted">
                      Discovered {formatMetaDate(discovery.discoveredAt)}
                    </p>
                  </div>
                  {discovery.pages.length === 0 ? (
                    <p className="text-[11px] text-muted">
                      No Facebook Pages were returned for this Meta user.
                    </p>
                  ) : null}
                  <div className="grid gap-2">
                    {discovery.pages.map((page) => {
                      const pageKey = platformKey("FACEBOOK_PAGE", page.id);
                      const pageSelected = selected.has(pageKey);
                      const parentAvailable =
                        page.alreadyConnected || pageSelected;
                      return (
                        <div
                          key={page.id}
                          className="rounded-lg border border-border bg-surface/40 p-2.5 grid gap-2"
                        >
                          <label className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={pageSelected || page.alreadyConnected}
                              disabled={
                                page.alreadyConnected ||
                                !page.isEligible ||
                                busy !== null
                              }
                              onChange={() => toggleSelection(pageKey)}
                            />
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-primary">
                                {page.name}
                              </span>
                              <span className="block text-[11px] text-muted">
                                {page.category || "Facebook Page"}
                                {page.alreadyConnected ? " · Connected" : ""}
                              </span>
                              {!page.isEligible ? (
                                <span className="block text-[11px] text-amber-300">
                                  {page.ineligibilityReason}
                                </span>
                              ) : null}
                            </span>
                          </label>

                          {page.instagram ? (
                            <label className="ml-6 flex items-start gap-2 border-l border-border pl-3">
                              <input
                                type="checkbox"
                                className="mt-0.5"
                                checked={
                                  selected.has(
                                    platformKey("INSTAGRAM", page.instagram.id),
                                  ) || page.instagram.alreadyConnected
                                }
                                disabled={
                                  page.instagram.alreadyConnected ||
                                  !page.instagram.isEligible ||
                                  !parentAvailable ||
                                  busy !== null
                                }
                                onChange={() =>
                                  toggleSelection(
                                    platformKey(
                                      "INSTAGRAM",
                                      page.instagram!.id,
                                    ),
                                  )
                                }
                              />
                              <span className="min-w-0">
                                <span className="block text-xs font-semibold text-primary">
                                  {page.instagram.name ||
                                    page.instagram.username ||
                                    "Instagram account"}
                                  {page.instagram.username ? (
                                    <span className="font-normal text-muted">
                                      {" "}
                                      · @{page.instagram.username}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="block text-[11px] text-muted">
                                  {page.instagram.alreadyConnected
                                    ? "Connected"
                                    : !parentAvailable
                                      ? "Select the parent Page in this list first."
                                      : "Instagram professional account linked to this Page"}
                                </span>
                                {!page.instagram.isEligible ? (
                                  <span className="block text-[11px] text-amber-300">
                                    {page.instagram.ineligibilityReason}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          ) : (
                            <p className="ml-6 text-[11px] text-muted">
                              No Instagram professional account is linked to
                              this Page.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#001018] disabled:opacity-50"
                      onClick={() => void saveSelection()}
                      disabled={selected.size === 0 || busy !== null}
                    >
                      {busy === "selection" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )}
                      Save {selected.size ? `${selected.size} ` : ""}selected
                      destination{selected.size === 1 ? "" : "s"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => setDiscovery(null)}
                      disabled={busy !== null}
                    >
                      Close
                    </button>
                  </div>
                  {selectionResult ? (
                    <div className="text-[11px] text-muted">
                      <p className="text-emerald-300">
                        {selectionResult.saved} destination
                        {selectionResult.saved === 1 ? "" : "s"} connected.
                      </p>
                      {selectionResult.skipped.map((item, index) => (
                        <p
                          key={`${item.platform}-${index}`}
                          className="text-amber-300"
                        >
                          Skipped {item.platform}: {item.reason}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-surface-strong/30 p-3 grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-primary">
                  Application publishing switch
                </p>
                <p className="text-[11px] text-muted">
                  Second kill-switch level. Even when enabled, every publication
                  still needs an explicit confirmation in the article panel.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-primary">
                <input
                  type="checkbox"
                  checked={overview.databasePublishingEnabled}
                  disabled={
                    busy !== null ||
                    !overview.configured ||
                    !overview.envPublishingEnabled
                  }
                  onChange={(event) =>
                    void togglePublishing(event.target.checked)
                  }
                />
                {busy === "settings"
                  ? "Saving…"
                  : overview.databasePublishingEnabled
                    ? "Enabled"
                    : "Disabled"}
              </label>
            </div>
            {!overview.envPublishingEnabled ? (
              <p className="text-[11px] text-amber-300">
                Blocked by the environment kill switch. Set
                META_PUBLISHING_ENABLED=true on the server; the database switch
                cannot override it.
              </p>
            ) : null}
            {!overview.configured ? (
              <p className="text-[11px] text-amber-300">
                Complete the server configuration before enabling this switch.
              </p>
            ) : null}
            <p className="text-[11px] text-muted">
              Effective status:{" "}
              <span className={armed ? "text-emerald-300" : "text-amber-300"}>
                {armed
                  ? "publishing allowed after confirmation"
                  : "all direct publishing blocked"}
              </span>
              {overview.settingsUpdatedAt
                ? ` · switch last changed ${formatMetaDate(overview.settingsUpdatedAt)}`
                : ""}
            </p>
            {connection ? (
              <p className="text-[11px] text-muted">
                {eligibleAccounts.length} eligible destination
                {eligibleAccounts.length === 1 ? "" : "s"} connected. No
                scheduled, bulk, or automatic retry publishing exists in this
                integration.
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
