"use client";

import { useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Deal } from "@/lib/types";
import { maskCurrencyDigits, currencyDigitsToNumber } from "@/lib/masks";

export type Option = { value: string; label: string };

type EditableSpec = {
  kind: "field";
  /** Chave do Deal que este campo grava. */
  key: keyof Deal;
  label: string;
  type: "text" | "number" | "date" | "select" | "bool" | "currency";
  options?: Option[];
  placeholder?: string;
  /** Obrigatório: não deixa salvar vazio (texto) ou grava 0 (moeda). */
  required?: boolean;
  /** Como o valor aparece quando não está editando. */
  display?: (deal: Deal) => React.ReactNode;
};

type ReadOnlySpec = {
  kind: "readonly";
  label: string;
  value?: React.ReactNode;
};

export type RowSpec = EditableSpec | ReadOnlySpec;

const compactInput =
  "w-full rounded-md border border-border bg-panel-bg px-2.5 py-1.5 text-[13px] text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors";

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-[13px] border-b border-border-soft last:border-b-0">
      <span className="text-text-faint shrink-0">{label}</span>
      <span className="text-text-dark font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

/** Valor atual do Deal -> texto que aparece no input. */
function toDraft(spec: EditableSpec, deal: Deal): string | boolean {
  const raw = deal[spec.key] as unknown;
  if (spec.type === "bool") return Boolean(raw);
  if (raw === undefined || raw === null || raw === "") return "";
  if (spec.type === "currency") return String(Math.round(Number(raw) * 100));
  return String(raw);
}

/** Texto do input -> valor que vai pro Deal (undefined = campo vazio, será apagado). */
function fromDraft(spec: EditableSpec, draft: string | boolean): unknown {
  if (spec.type === "bool") return Boolean(draft);
  const s = String(draft).trim();
  if (spec.type === "currency") {
    const n = currencyDigitsToNumber(s);
    return n > 0 ? n : spec.required ? 0 : undefined;
  }
  if (s === "") return undefined;
  if (spec.type === "number") {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return s;
}

export default function EditableCard({
  title,
  deal,
  rows,
  subtitle,
  onSave,
  headerIcon,
}: {
  title: string;
  deal: Deal;
  rows: RowSpec[];
  /** Texto pequeno acima das linhas (ex.: "Campos sem grupo"). */
  subtitle?: string;
  onSave: (patch: Partial<Deal>) => void | Promise<void>;
  /** Ícone do botão de editar (padrão: lápis). */
  headerIcon?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});

  const fields = rows.filter((r): r is EditableSpec => r.kind === "field");

  function startEdit() {
    const d: Record<string, string | boolean> = {};
    fields.forEach((f) => {
      d[String(f.key)] = toDraft(f, deal);
    });
    setDraft(d);
    setEditing(true);
  }

  async function handleSave() {
    const patch: Record<string, unknown> = {};
    for (const f of fields) {
      const novo = fromDraft(f, draft[String(f.key)]);
      // Campo obrigatório de texto não pode ficar vazio: mantém o que já estava.
      if (f.required && f.type !== "currency" && novo === undefined) continue;
      const atual = deal[f.key] as unknown;
      const igual =
        novo === atual ||
        (novo === undefined && (atual === undefined || atual === null || atual === "")) ||
        (f.type === "bool" && novo === false && !atual);
      if (!igual) patch[String(f.key)] = novo;
    }
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(patch as Partial<Deal>);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function set(key: keyof Deal, value: string | boolean) {
    setDraft((prev) => ({ ...prev, [String(key)]: value }));
  }

  function renderInput(f: EditableSpec) {
    const k = String(f.key);
    const v = draft[k];
    switch (f.type) {
      case "select": {
        const opts = [...(f.options ?? [])];
        // Mantém visível um valor antigo que não está na lista (ex.: dado importado).
        if (typeof v === "string" && v && !opts.some((o) => o.value === v)) {
          opts.unshift({ value: v, label: v });
        }
        return (
          <select className={compactInput} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)}>
            {!f.required && <option value="">—</option>}
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      }
      case "bool":
        return (
          <label className="flex items-center gap-2 text-[13px] text-text-dark cursor-pointer py-1">
            <input
              type="checkbox"
              className="accent-brand h-4 w-4"
              checked={Boolean(v)}
              onChange={(e) => set(f.key, e.target.checked)}
            />
            Sim
          </label>
        );
      case "currency":
        return (
          <input
            inputMode="numeric"
            className={compactInput}
            value={v ? maskCurrencyDigits(String(v)) : ""}
            onChange={(e) => set(f.key, e.target.value.replace(/\D/g, ""))}
            placeholder="0,00"
          />
        );
      case "number":
        return (
          <input
            type="number"
            step="any"
            className={compactInput}
            value={String(v ?? "")}
            onChange={(e) => set(f.key, e.target.value)}
            placeholder={f.placeholder}
          />
        );
      case "date":
        return (
          <input
            type="date"
            className={compactInput}
            value={String(v ?? "")}
            onChange={(e) => set(f.key, e.target.value)}
          />
        );
      default:
        return (
          <input
            className={compactInput}
            value={String(v ?? "")}
            onChange={(e) => set(f.key, e.target.value)}
            placeholder={f.placeholder}
          />
        );
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card-bg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="font-display font-semibold text-[13px] text-text-dark tracking-wide">{title}</h4>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="text-text-faint hover:text-brand-strong transition-colors"
            aria-label={`Editar ${title}`}
            title="Editar"
          >
            {headerIcon ?? <Pencil size={13} />}
          </button>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-1">{subtitle}</p>
      )}

      {!editing ? (
        rows.map((r) =>
          r.kind === "readonly" ? (
            <InfoRow key={r.label} label={r.label} value={r.value} />
          ) : (
            <InfoRow key={String(r.key)} label={r.label} value={r.display ? r.display(deal) : defaultDisplay(r, deal)} />
          )
        )
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) =>
            r.kind === "readonly" ? (
              <InfoRow key={r.label} label={r.label} value={r.value} />
            ) : (
              <div key={String(r.key)}>
                <span className="block text-[12px] text-text-faint mb-1">{r.label}</span>
                {renderInput(r)}
              </div>
            )
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium text-text-gray hover:bg-panel-bg transition-colors disabled:opacity-60"
            >
              <X size={13} />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function defaultDisplay(spec: EditableSpec, deal: Deal): React.ReactNode {
  const raw = deal[spec.key] as unknown;
  if (spec.type === "bool") return raw ? "Sim" : undefined;
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (spec.type === "select") {
    return spec.options?.find((o) => o.value === raw)?.label ?? String(raw);
  }
  return String(raw);
}
