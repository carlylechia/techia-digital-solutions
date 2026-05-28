interface Props {
  actions: string[];
  onSelect: (action: string) => void;
  disabled?: boolean;
}

export function AIQuickActions({ actions, onSelect, disabled }: Props) {
  return (
    <div className="border-t border-border bg-surface-elevated px-3 py-3 flex-shrink-0">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
        Quick start
      </p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => onSelect(action)}
            disabled={disabled}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-primary transition-colors hover:border-accent hover:text-accent hover:bg-accent/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
