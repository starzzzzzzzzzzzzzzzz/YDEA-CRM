"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { inputClass } from "./Field";

export type ComboOption = { value: string; sublabel?: string; id?: string };

const sem = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/**
 * Campo de texto que também lista sugestões ao clicar: escolhe da lista OU digita livremente.
 * `onChange` roda a cada tecla; `onPick` só quando uma sugestão é escolhida (se faltar, usa `onChange`).
 */
export default function ComboInput({
  value,
  onChange,
  onPick,
  options,
  placeholder,
  sufixo,
  className,
  inputMode,
  limite = 80,
  vazioHint = "Nenhuma sugestão — digite manualmente.",
}: {
  value: string;
  onChange: (texto: string) => void;
  onPick?: (opcao: ComboOption) => void;
  options: ComboOption[];
  placeholder?: string;
  sufixo?: string;
  className?: string;
  inputMode?: "text" | "decimal" | "numeric";
  limite?: number;
  vazioHint?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const filtradas = useMemo(() => {
    const q = sem(value);
    // Texto igual a uma opção (ou vazio) = mostra tudo, para dar para trocar a escolha.
    if (!q || options.some((o) => sem(o.value) === q)) return options;
    const comeca = options.filter((o) => sem(o.value).startsWith(q));
    const contem = options.filter((o) => !sem(o.value).startsWith(q) && sem(o.value).includes(q));
    return [...comeca, ...contem];
  }, [options, value]);
  const visiveis = filtradas.slice(0, limite);

  function escolher(o: ComboOption) {
    (onPick ?? ((x: ComboOption) => onChange(x.value)))(o);
    setAberto(false);
  }

  function teclas(e: React.KeyboardEvent) {
    if (!aberto) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAberto(true);
        setDestaque(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestaque((h) => Math.min(h + 1, visiveis.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && visiveis[destaque]) {
      e.preventDefault();
      escolher(visiveis[destaque]);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setAberto(false);
    }
  }

  return (
    <div ref={raiz} className="relative">
      <input
        className={`${inputClass} pr-9 ${className ?? ""}`}
        style={sufixo ? { paddingRight: "4.5rem" } : undefined}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        onFocus={() => {
          setAberto(true);
          setDestaque(0);
        }}
        onClick={() => setAberto(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
          setDestaque(0);
        }}
        onKeyDown={teclas}
      />
      {sufixo && <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-[12px] text-text-faint">{sufixo}</span>}
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-faint" />

      {aberto && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-border bg-card-bg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1.5">
            {visiveis.length === 0 ? (
              <div className="px-3.5 py-3 text-center text-xs text-text-faint">{vazioHint}</div>
            ) : (
              visiveis.map((o, idx) => (
                <button
                  key={o.id ?? o.value}
                  type="button"
                  onMouseEnter={() => setDestaque(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => escolher(o)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left text-sm transition-colors ${idx === destaque ? "bg-brand-soft" : "hover:bg-panel-bg"}`}
                >
                  <span className="min-w-0 truncate font-medium text-text-dark">{o.value}</span>
                  {o.sublabel && <span className="shrink-0 text-xs text-text-faint">{o.sublabel}</span>}
                </button>
              ))
            )}
            {filtradas.length > visiveis.length && (
              <div className="px-3.5 py-2 text-center text-xs text-text-faint border-t border-border-soft">
                Mostrando {visiveis.length} de {filtradas.length} — digite para filtrar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const fmtNumero = (n: number) => (n ? String(n).replace(".", ",") : "");
const lerNumero = (t: string) => {
  const n = parseFloat(t.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Versão numérica: guarda número, mas deixa digitar "3,6" livremente e lista as potências disponíveis. */
export function ComboNumero({
  value,
  onChange,
  onPick,
  options,
  sufixo,
  placeholder,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  onPick?: (n: number) => void;
  options: { potencia: number; sublabel?: string }[];
  sufixo?: string;
  placeholder?: string;
  className?: string;
}) {
  const [texto, setTexto] = useState(fmtNumero(value));
  const [anterior, setAnterior] = useState(value);
  // Valor mudou por fora (ex.: escolheu um modelo) → atualiza o texto exibido.
  if (anterior !== value) {
    setAnterior(value);
    if (lerNumero(texto) !== value) setTexto(fmtNumero(value));
  }
  return (
    <ComboInput
      value={texto}
      inputMode="decimal"
      sufixo={sufixo}
      placeholder={placeholder}
      className={className}
      options={options.map((o) => ({ value: fmtNumero(o.potencia), sublabel: o.sublabel, id: String(o.potencia) }))}
      onChange={(t) => {
        setTexto(t);
        onChange(lerNumero(t));
      }}
      onPick={(o) => {
        const n = Number(o.id);
        setTexto(fmtNumero(n));
        (onPick ?? onChange)(n);
      }}
    />
  );
}
