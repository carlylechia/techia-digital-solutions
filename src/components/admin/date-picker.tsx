"use client";

import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import { useRef, useState } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIso(iso: string): Date | undefined {
  if (!iso) return undefined;
  const parts = iso.slice(0, 10).split("-").map(Number);
  if (parts.length < 3) return undefined;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return isNaN(d.getTime()) ? undefined : d;
}

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function isSame(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── DatePicker ────────────────────────────────────────────────────────────────

interface DatePickerProps {
  name: string;
  defaultValue?: string; // YYYY-MM-DD
  placeholder?: string;
  id?: string;
  className?: string;
}

export function DatePicker({
  name,
  defaultValue,
  placeholder = "Pick a date",
  id,
  className,
}: DatePickerProps) {
  const [selected, setSelected] = useState<Date | undefined>(
    defaultValue ? fromIso(defaultValue) : undefined
  );
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => {
    const d = defaultValue ? fromIso(defaultValue) : undefined;
    return d ?? new Date();
  });
  const [openUpward, setOpenUpward] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const today = new Date();

  // Calculate whether calendar should open above or below
  function handleOpen() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 320);
    }
    setOpen((v) => !v);
  }

  function prevMonth() {
    setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  }
  function nextMonth() {
    setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));
  }

  function getDays(): (Date | null)[] {
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }

  function pick(d: Date) {
    setSelected(d);
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setSelected(undefined);
  }

  const inputValue = selected ? toIso(selected) : "";

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Hidden value for form submission */}
      <input type="hidden" name={name} value={inputValue} />

      {/* Trigger */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={handleOpen}
        className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:border-accent/50 focus:outline-none focus:border-accent"
      >
        <CalendarDays className="size-4 shrink-0 text-muted" />
        <span className={`min-w-0 flex-1 truncate text-left ${selected ? "text-primary" : "text-muted/60"}`}>
          {selected ? fmt(selected) : placeholder}
        </span>
        {selected && (
          <X
            className="size-3.5 shrink-0 text-muted transition-colors hover:text-primary"
            onClick={clear}
          />
        )}
      </button>

      {/* Calendar popover */}
      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            className={[
              "absolute left-0 z-50 w-[min(18rem,calc(100vw-2rem))] max-w-[18rem] rounded-xl border border-border bg-surface p-3 shadow-2xl",
              openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5",
            ].join(" ")}
          >
            {/* Month navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-semibold text-primary select-none">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="mb-1 grid grid-cols-7 text-center">
              {WEEKDAYS.map((d) => (
                <span
                  key={d}
                  className="py-1 text-[10px] font-semibold uppercase tracking-wider text-muted"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {getDays().map((day, i) => {
                if (!day) return <span key={`e-${i}`} />;
                const isSelected = selected ? isSame(day, selected) : false;
                const isToday = isSame(day, today);
                return (
                  <button
                    key={day.getTime()}
                    type="button"
                    onClick={() => pick(day)}
                    className={[
                      "flex aspect-square items-center justify-center rounded-md text-sm transition-colors",
                      isSelected
                        ? "bg-accent font-semibold text-background"
                        : isToday
                        ? "border border-accent/40 font-semibold text-accent hover:bg-accent/10"
                        : "text-primary hover:bg-background",
                    ].join(" ")}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <button
                type="button"
                onClick={() => {
                  pick(today);
                  setView(today);
                }}
                className="text-xs text-muted transition-colors hover:text-accent"
              >
                Today
              </button>
              {selected && (
                <button
                  type="button"
                  onClick={() => { setSelected(undefined); setOpen(false); }}
                  className="text-xs text-muted transition-colors hover:text-red-400"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
