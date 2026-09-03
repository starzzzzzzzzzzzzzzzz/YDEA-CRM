export function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card-bg p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-8 w-8 rounded-lg bg-brand-soft text-brand-strong flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-[12.5px] font-medium text-text-gray">{label}</span>
      </div>
      <p className="font-display font-bold text-xl text-text-dark leading-none">{value}</p>
      {hint && <p className="text-[11.5px] text-text-faint mt-1.5">{hint}</p>}
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card-bg p-5">
      <h3 className="font-display font-semibold text-[13.5px] text-text-dark mb-4">{title}</h3>
      {children}
    </div>
  );
}

export const CHART_COLORS = {
  brand: "#AADD00",
  brandStrong: "#8CB800",
  blue: "#3B82F6",
  amber: "#F59E0B",
  red: "#FF4D4D",
  gray: "#666666",
  grid: "#e8e8e8",
};

export const PIE_COLORS = [CHART_COLORS.brand, CHART_COLORS.brandStrong, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.red, CHART_COLORS.gray];

export function isSameMonth(dateStr: string | undefined, ref: Date) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function monthLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}
