export const inputClass =
  "w-full rounded-lg border border-border bg-panel-bg px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

export const inputErrorClass =
  "border-badge-red-text/60 focus:border-badge-red-text focus:ring-badge-red-text/40";

export function Field({
  label,
  required,
  className,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-[13px] font-medium text-text-dark mb-1.5">
        {label}
        {required && <span className="text-brand-strong"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-[11.5px] text-badge-red-text mt-1">{error}</span>
      ) : hint ? (
        <span className="block text-[11.5px] text-text-faint mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

export function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-1">
      <h3 className="font-display font-semibold text-[13.5px] text-text-dark tracking-wide">
        {children}
      </h3>
      {subtitle && <p className="text-[12px] text-text-faint mt-0.5">{subtitle}</p>}
    </div>
  );
}
