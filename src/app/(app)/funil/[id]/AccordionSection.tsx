"use client";

import { useState } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

export function Field({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[12.5px] text-text-gray shrink-0">{label}</span>
      <span className="text-[12.5px] font-medium text-text-dark text-right">
        {value === undefined || value === null || value === "" ? (
          <span className="text-text-faint font-normal">—</span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

export default function AccordionSection({
  icon: Icon,
  title,
  badge,
  badgeTone = "neutral",
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  badge?: string;
  badgeTone?: "neutral" | "warning" | "success" | "brand";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const badgeClass =
    badgeTone === "warning"
      ? "bg-badge-red-bg text-badge-red-text"
      : badgeTone === "success"
      ? "bg-badge-green-bg text-badge-green-text"
      : badgeTone === "brand"
      ? "bg-brand-soft text-brand"
      : "bg-panel-bg text-text-gray";

  return (
    <div className="border border-border rounded-lg bg-card-bg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-panel-bg transition-colors"
      >
        <Icon size={16} className="text-text-gray shrink-0" strokeWidth={1.8} />
        <span className="text-[13px] font-semibold text-text-dark flex-1 text-left">
          {title}
        </span>
        {badge && (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}
          >
            {badge}
          </span>
        )}
        <ChevronDown
          size={15}
          className={`text-text-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-3.5 pb-3 pt-0.5 border-t border-border-soft">
          {children}
        </div>
      )}
    </div>
  );
}
