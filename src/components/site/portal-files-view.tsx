"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useTransition } from "react";
import {
  Files,
  Download,
  Upload,
  ImageIcon,
  FileText,
  Video,
  Archive,
  X,
  Plus,
} from "lucide-react";
import type { PortalFile } from "@/lib/portal-data";
import { usePortalLocale } from "@/lib/portal-locale-context";
import { timeAgoPortal } from "@/lib/portal-i18n";

const CATEGORIES = ["ALL", "DELIVERABLE", "ASSET", "DOCUMENT", "DESIGN", "CONTRACT", "OTHER"] as const;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(iso: string | null, locale: string) {
  if (!iso) return "";
  return timeAgoPortal(iso, locale as "en" | "fr");
}

function FileIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.startsWith("image/")) return <ImageIcon className="size-5 text-pink-400" />;
  if (t.startsWith("video/")) return <Video className="size-5 text-blue-400" />;
  if (t === "application/pdf") return <FileText className="size-5 text-red-400" />;
  if (t.includes("zip") || t.includes("rar") || t.includes("tar"))
    return <Archive className="size-5 text-amber-400" />;
  return <Files className="size-5 text-violet-400" />;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "text-amber-400 bg-amber-400/10",
    APPROVED: "text-emerald-400 bg-emerald-400/10",
    REJECTED: "text-red-400 bg-red-400/10",
    ARCHIVED: "text-slate-400 bg-slate-400/10",
  };
  return map[status] || "text-slate-400 bg-slate-400/10";
}

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const { t } = usePortalLocale();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setUploading(true);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("category", "DELIVERABLE");

    try {
      const res = await fetch("/api/portal/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t.files.errors.uploadFailed);
      } else {
        onUploaded();
        onClose();
      }
    } catch {
      setError(t.files.errors.networkError);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="my-6 w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0d1b2a] p-5 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">{t.files.modalTitle}</h2>
            <button type="button" onClick={onClose} className="text-slate-500 transition hover:text-white">
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleUpload} className="grid gap-4">
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/[0.1] py-8 text-center transition hover:border-cyan-500/40 hover:bg-white/[0.02]"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-7 text-slate-500" />
              {file ? (
                <p className="break-all text-sm font-medium text-white">{file.name}</p>
              ) : (
                <p className="text-sm text-slate-500">{t.files.selectFile}</p>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.03] py-2.5 text-sm font-medium text-slate-400 transition hover:text-white"
              >
                {t.files.cancel}
              </button>
              <button
                type="submit"
                disabled={!file || uploading}
                className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploading ? t.files.uploading : t.files.uploadBtn}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function PortalFilesView({
  files,
}: {
  files: PortalFile[];
}) {
  const { locale, t } = usePortalLocale();
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [showUpload, setShowUpload] = useState(false);
  const [, startRefresh] = useTransition();

  const filtered = filter === "ALL" ? files : files.filter((f) => f.category === filter);

  return (
    <>
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            startRefresh(() => {
              router.refresh();
            });
          }}
        />
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category filter */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === cat
                  ? "bg-cyan-600 text-white"
                  : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {cat === "ALL" ? t.files.categories.ALL : t.files.categories[cat] ?? (cat.charAt(0) + cat.slice(1).toLowerCase())}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 sm:w-auto"
        >
          <Plus className="size-4" />
          {t.files.upload}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] px-6 py-16 text-center">
          <Files className="size-10 text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-400">{t.files.empty}</p>
          <p className="mt-1 text-xs text-slate-600">{t.files.emptyNote(filter)}</p>
        </div>
      ) : (
        <div className="grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((file) => (
            <div
              key={file.id}
              className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                  <FileIcon type={file.fileType} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-white">{file.name}</p>
                  <p className="mt-0.5 break-words text-xs capitalize text-slate-500">
                    {file.category.toLowerCase()} · {file.size ? formatSize(file.size) : "—"}
                  </p>
                </div>
              </div>

              {file.notes && (
                <p className="mt-3 line-clamp-3 break-words text-xs text-slate-500">{file.notes}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(file.status)}`}>
                    {file.status.toLowerCase()}
                  </span>
                  <span className="text-xs text-slate-600">{timeAgo(file.createdAt, locale)}</span>
                </div>
                {file.url && file.url !== "#" && file.url !== "#not-uploaded" && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-white/20 hover:text-white min-[420px]:w-auto"
                  >
                    <Download className="size-3" />
                    {t.files.download}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
