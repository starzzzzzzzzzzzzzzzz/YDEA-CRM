"use client";

import { inputClass } from "@/components/ui/Field";
import { currencyDigitsToNumber, maskCurrencyDigits } from "@/lib/masks";
import type { PropostaDados } from "@/lib/propostas/types";

/** Props comuns das etapas do wizard. */
export type EtapaProps = {
  dados: PropostaDados;
  set: <K extends keyof PropostaDados>(campo: K, valor: PropostaDados[K]) => void;
  erros: Record<string, string>;
};

export function Secao({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section className="bg-card-bg border border-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-[15px] text-text-dark">{titulo}</h3>
        {subtitulo && <p className="text-[12px] text-text-faint mt-0.5">{subtitulo}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Campo numérico (aceita decimais). Vazio = 0. */
export function NumeroInput({
  value,
  onChange,
  placeholder,
  sufixo,
  casas,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  sufixo?: string;
  casas?: number;
  className?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="decimal"
        step={casas ? 1 / Math.pow(10, casas) : "any"}
        min={0}
        className={`${inputClass} ${sufixo ? "pr-16" : ""} ${className ?? ""}`}
        value={value ? value : ""}
        placeholder={placeholder}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          onChange(Number.isFinite(n) && n >= 0 ? n : 0);
        }}
      />
      {sufixo && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-text-faint">
          {sufixo}
        </span>
      )}
    </div>
  );
}

/** Campo em reais, digitado em centavos (mesmo padrão de máscara do resto do CRM). */
export function MoedaInput({
  value,
  onChange,
  placeholder = "0,00",
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-text-faint">R$</span>
      <input
        inputMode="numeric"
        className={`${inputClass} pl-9`}
        value={value ? maskCurrencyDigits(String(Math.round(value * 100))) : ""}
        placeholder={placeholder}
        onChange={(e) => onChange(currencyDigitsToNumber(e.target.value))}
      />
    </div>
  );
}

export function Resumo({ itens }: { itens: { rotulo: string; valor: string; destaque?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {itens.map((i) => (
        <span
          key={i.rotulo}
          className={`rounded-md border px-2.5 py-1 text-[11.5px] ${
            i.destaque
              ? "border-brand/50 bg-brand-soft text-text-dark font-semibold"
              : "border-border bg-panel-bg text-text-gray"
          }`}
        >
          {i.rotulo}: <b className="text-text-dark">{i.valor}</b>
        </span>
      ))}
    </div>
  );
}
