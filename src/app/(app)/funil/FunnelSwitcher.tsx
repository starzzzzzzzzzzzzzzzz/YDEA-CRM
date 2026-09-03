"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { Funnel } from "@/lib/types";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FunnelSwitcher({
  funnels,
  activeId,
  totalsById,
  onChange,
}: {
  funnels: Funnel[];
  activeId: string;
  totalsById: Record<string, { count: number; total: number }>;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = funnels.find((f) => f.id === activeId)!;
  const activeTotals = totalsById[activeId];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-lg border border-border bg-card-bg px-4 py-2.5 hover:border-brand transition-colors"
      >
        <Pencil size={13} className="text-text-faint shrink-0" />
        <div className="text-left leading-tight">
          <div className="text-[13.5px] font-semibold text-text-dark">{active.name}</div>
          <div className="text-[11px] text-text-faint">
            {formatBRL(activeTotals?.total ?? 0)} · {activeTotals?.count ?? 0} negócios
          </div>
        </div>
        <ChevronDown size={15} className="text-text-faint shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-72 rounded-lg border border-border bg-card-bg shadow-lg py-1.5 z-30">
          {funnels.map((f) => {
            const totals = totalsById[f.id];
            return (
              <button
                key={f.id}
                onClick={() => {
                  onChange(f.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-panel-bg transition-colors ${
                  f.id === activeId ? "bg-brand-soft" : ""
                }`}
              >
                <span
                  className={`text-[13px] font-medium ${
                    f.id === activeId ? "text-brand-strong" : "text-text-dark"
                  }`}
                >
                  {f.name}
                </span>
                <span className="text-[11px] text-text-faint">
                  {totals?.count ?? 0} · {formatBRL(totals?.total ?? 0)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
