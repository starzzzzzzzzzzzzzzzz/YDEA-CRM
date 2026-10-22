"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookUser, Contact, Filter, X } from "lucide-react";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { FUNNELS } from "@/lib/funnels";

type Resultado = {
  key: string;
  tipo: "Cliente" | "Lead" | "Negócio";
  titulo: string;
  detalhe: string;
  onSelect: () => void;
};

const MAX_POR_GRUPO = 5;

/** Normaliza: minúsculas e sem acentos, para "joao" achar "João". */
function norm(s?: string | null) {
  return (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function digitos(s?: string | null) {
  return (s ?? "").replace(/\D/g, "");
}

export default function GlobalSearch() {
  const router = useRouter();
  const { clientes, leads, deals, getOrganizacao, getPessoa } = useCrmData();
  const [query, setQuery] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  function fechar() {
    setAberto(false);
    setQuery("");
    setAtivo(0);
  }

  function abrirNegocio(id: string) {
    if (window.location.pathname.startsWith("/funil")) {
      window.dispatchEvent(new CustomEvent("abrir-negocio", { detail: id }));
    } else {
      router.push(`/funil?negocio=${id}`);
    }
  }

  const resultados: Resultado[] = useMemo(() => {
    const q = norm(query).trim();
    if (q.length < 1) return [];
    const qNum = digitos(query);

    const bate = (campos: (string | undefined | null)[], numericos: (string | undefined | null)[] = []) =>
      campos.some((c) => norm(c).includes(q)) ||
      (qNum.length >= 3 && numericos.some((n) => digitos(n).includes(qNum)));

    const cli: Resultado[] = clientes
      .filter((c) =>
        bate(
          [c.nome, c.nomeFantasia, c.razaoSocial, c.email, c.cidade, c.codigo, c.empresa],
          [c.cpf, c.cnpj, c.telefone, c.whatsapp]
        )
      )
      .slice(0, MAX_POR_GRUPO)
      .map((c) => ({
        key: `c-${c.id}`,
        tipo: "Cliente" as const,
        titulo: c.nome,
        detalhe: [c.codigo, c.cidade && c.cidade !== "—" ? c.cidade : ""].filter(Boolean).join(" · "),
        onSelect: () => router.push(`/clientes/${c.id}`),
      }));

    const led: Resultado[] = leads
      .filter((l) => bate([l.cliente, l.local, ...(l.tags ?? [])]))
      .slice(0, MAX_POR_GRUPO)
      .map((l) => ({
        key: `l-${l.id}`,
        tipo: "Lead" as const,
        titulo: l.cliente,
        detalhe: l.local,
        onSelect: () => router.push("/leads"),
      }));

    const neg: Resultado[] = deals
      .filter((d) => {
        const org = getOrganizacao(d.organizacaoId);
        const pes = getPessoa(d.pessoaId);
        return bate(
          [d.titulo, d.responsavel, d.numeroUC, org?.nome, org?.razaoSocial, org?.nomeFantasia, pes?.nome],
          [org?.cnpj, org?.cpf, pes?.cpf, org?.telefone, pes?.telefone]
        );
      })
      .slice(0, MAX_POR_GRUPO)
      .map((d) => {
        const funil = FUNNELS.find((f) => f.id === d.funnelId);
        const etapa = funil?.stages.find((e) => e.id === d.stageId);
        return {
          key: `d-${d.id}`,
          tipo: "Negócio" as const,
          titulo: d.titulo,
          detalhe: [funil?.name, etapa?.label].filter(Boolean).join(" · "),
          onSelect: () => abrirNegocio(d.id),
        };
      });

    return [...cli, ...led, ...neg];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, clientes, leads, deals]);

  // Fecha ao clicar fora.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function escolher(r: Resultado) {
    r.onSelect();
    fechar();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setAtivo((i) => Math.min(i + 1, Math.max(resultados.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const r = resultados[ativo];
      if (r) {
        e.preventDefault();
        escolher(r);
      }
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  const icone = { Cliente: BookUser, Lead: Contact, Negócio: Filter } as const;
  const mostrarPainel = aberto && query.trim().length > 0;

  return (
    <div ref={boxRef} className="flex-1 max-w-md relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setAtivo(0);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={onKeyDown}
        placeholder="Pesquisar clientes, leads, negócios..."
        aria-label="Pesquisar"
        className="w-full rounded-lg border border-border bg-panel-bg pl-9 pr-8 py-2 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Limpar pesquisa"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-dark"
        >
          <X size={14} />
        </button>
      )}

      {mostrarPainel && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl border border-border bg-card-bg shadow-lg z-40 overflow-hidden max-h-96 overflow-y-auto">
          {resultados.length === 0 ? (
            <p className="px-3.5 py-3 text-[12.5px] text-text-faint">Nenhum resultado para “{query}”.</p>
          ) : (
            resultados.map((r, i) => {
              const Icon = icone[r.tipo];
              return (
                <button
                  key={r.key}
                  type="button"
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => escolher(r)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                    i === ativo ? "bg-panel-bg" : ""
                  }`}
                >
                  <Icon size={15} className="text-text-faint shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-text-dark truncate">{r.titulo}</p>
                    {r.detalhe && <p className="text-[11px] text-text-faint truncate">{r.detalhe}</p>}
                  </div>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-text-faint shrink-0">
                    {r.tipo}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
