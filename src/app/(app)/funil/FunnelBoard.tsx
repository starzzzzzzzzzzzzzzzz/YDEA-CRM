"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Plus, Filter, LayoutGrid, List, Download, Info, X, CalendarCheck2, CalendarX2,
  CalendarClock, Clock, Flame, Snowflake, Thermometer, User2, Zap,
} from "lucide-react";
import { Deal, FunnelId, Temperatura, PERFIL_CLIENTE_LABEL, TEMPERATURA_LABEL } from "@/lib/types";
import { FUNNELS } from "@/lib/funnels";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { hasPermission } from "@/lib/db/permissoes";
import { checarAtividadesPorDeals } from "@/lib/firebase/atividades";
import FunnelSwitcher from "./FunnelSwitcher";
import NewDealModal from "./NewDealModal";
import DealDetailPanel from "./DealDetailPanel";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AtividadeIcone({ temAtividade }: { temAtividade?: boolean }) {
  if (temAtividade === undefined) {
    return (
      <span
        title="Verificando atividades..."
        className="h-6 w-6 rounded-lg bg-panel-bg shrink-0"
      />
    );
  }
  return temAtividade ? (
    <span
      title="Tem atividade pendente"
      className="h-6 w-6 rounded-lg bg-badge-green-bg flex items-center justify-center shrink-0"
    >
      <CalendarCheck2
        size={14}
        strokeWidth={2.25}
        className="text-badge-green-text"
        aria-label="Tem atividade pendente"
      />
    </span>
  ) : (
    <span
      title="Sem atividade pendente"
      className="h-6 w-6 rounded-lg bg-badge-red-bg flex items-center justify-center shrink-0"
    >
      <CalendarX2
        size={14}
        strokeWidth={2.25}
        className="text-badge-red-text"
        aria-label="Sem atividade pendente"
      />
    </span>
  );
}

const PRIORIDADE_ACCENT: Record<string, string> = {
  baixa: "bg-border",
  media: "bg-amber-400",
  alta: "bg-red-500",
};

const TEMPERATURA_CHIP: Record<Temperatura, { Icone: typeof Flame; classe: string }> = {
  frio: { Icone: Snowflake, classe: "bg-badge-blue-bg text-badge-blue-text" },
  morno: { Icone: Thermometer, classe: "bg-badge-amber-bg text-badge-amber-text" },
  quente: { Icone: Flame, classe: "bg-badge-red-bg text-badge-red-text" },
};

/** Dias inteiros desde uma data ISO ("2026-10-06" ou com hora). null se não der para ler. */
function diasDesde(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

/** Há quantos dias o negócio está na etapa atual (usa o histórico; sem ele, a data de criação). */
function diasNaEtapa(deal: Deal): number | null {
  const ultima = [...(deal.historicoEtapas ?? [])].reverse().find((h) => h.stageId === deal.stageId);
  return diasDesde(ultima?.em ?? deal.createdAt);
}

function textoDias(n: number) {
  if (n === 0) return "hoje";
  if (n < 60) return `${n} d`;
  return `${Math.floor(n / 30)} meses`;
}

/** "2026-11-20" -> "20/11". */
function diaMes(iso?: string) {
  const m = iso?.match(/^\d{4}-(\d{2})-(\d{2})/);
  return m ? `${m[2]}/${m[1]}` : "";
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function DealCard({
  deal,
  dragging,
  temAtividade,
  onOpen,
}: {
  deal: Deal;
  dragging?: boolean;
  /** true = tem atividade registrada (calendário verde); false = nenhuma (calendário vermelho); undefined = ainda carregando */
  temAtividade?: boolean;
  onOpen?: (id: string) => void;
}) {
  const { getOrganizacao, getPessoa } = useCrmData();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const subtitulo = getOrganizacao(deal.organizacaoId)?.nome ?? getPessoa(deal.pessoaId)?.nome;

  const status = deal.status ?? "aberto";
  const aberto = status === "aberto";
  const accentColor =
    status === "ganho"
      ? "bg-badge-green-text"
      : status === "perdido"
      ? "bg-badge-red-text"
      : PRIORIDADE_ACCENT[deal.prioridade ?? "media"] ?? PRIORIDADE_ACCENT.media;

  const temp = deal.temperatura ? TEMPERATURA_CHIP[deal.temperatura] : null;
  const potencia = deal.potenciaSistema
    ? `${deal.potenciaSistema.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kWp`
    : "";
  const perfil = deal.perfilCliente ? PERFIL_CLIENTE_LABEL[deal.perfilCliente] : "";
  const probabilidade =
    aberto && typeof deal.probabilidade === "number"
      ? Math.min(100, Math.max(0, deal.probabilidade))
      : null;

  // Prazo (negócio aberto) ou data de fechamento (ganho/perdido).
  const dataPrazo = aberto ? deal.previsaoFechamento : deal.fechadoEm;
  const hojeIso = new Date().toLocaleDateString("sv-SE");
  const atrasado = aberto && !!deal.previsaoFechamento && deal.previsaoFechamento.slice(0, 10) < hojeIso;

  // Tempo parado na etapa: só importa para negócio aberto.
  const parado = aberto ? diasNaEtapa(deal) : null;
  const paradoClasse =
    parado === null ? "text-text-faint" : parado >= 30 ? "text-red" : parado >= 14 ? "text-badge-amber-text" : "text-text-faint";

  const responsavel = deal.responsavel?.trim() || "Sem responsável";
  const semResponsavel = responsavel === "Sem responsável";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen?.(deal.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen?.(deal.id);
      }}
      className={`group relative overflow-hidden bg-card-bg border border-border-soft rounded-xl pl-4 pr-3.5 pt-3 pb-2.5 shadow-sm cursor-grab active:cursor-grabbing select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-brand transition-all duration-200 ease-out motion-reduce:transition-none ${
        isDragging && !dragging ? "opacity-30" : ""
      } ${
        dragging
          ? "shadow-xl rotate-1 scale-[1.02]"
          : "hover:border-brand hover:shadow-md hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      }`}
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${accentColor} transition-colors`} />

      {/* Título + status */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-text-dark text-[13px] leading-snug line-clamp-2">
          {deal.titulo}
        </h4>
        {!aberto && (
          <span
            title={status === "perdido" ? deal.motivoPerda || "Perdido" : "Ganho"}
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
              status === "ganho"
                ? "bg-badge-green-bg text-badge-green-text"
                : "bg-badge-red-bg text-badge-red-text"
            }`}
          >
            {status === "ganho" ? "Ganho" : "Perdido"}
          </span>
        )}
      </div>
      <p className="flex items-center gap-1 text-[11.5px] text-text-faint mt-0.5 min-h-[16px]">
        {subtitulo ? (
          <>
            <User2 size={11} className="shrink-0" />
            <span className="truncate">{subtitulo}</span>
          </>
        ) : (
          "\u00A0"
        )}
      </p>

      {/* Chips: só aparecem quando o dado existe */}
      {(temp || potencia || perfil) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {temp && deal.temperatura && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${temp.classe}`}>
              <temp.Icone size={11} strokeWidth={2.25} />
              {TEMPERATURA_LABEL[deal.temperatura]}
            </span>
          )}
          {potencia && (
            <span className="inline-flex items-center gap-1 rounded-full bg-panel-bg px-2 py-0.5 text-[10.5px] font-medium text-text-gray">
              <Zap size={11} strokeWidth={2.25} />
              {potencia}
            </span>
          )}
          {perfil && (
            <span className="rounded-full bg-panel-bg px-2 py-0.5 text-[10.5px] font-medium text-text-gray">
              {perfil}
            </span>
          )}
        </div>
      )}

      {/* Valor + probabilidade */}
      <div className="mt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display font-bold text-[15px] text-text-dark leading-none">
            {formatBRL(deal.valor)}
          </span>
          {probabilidade !== null && (
            <span className="text-[11px] font-medium text-text-gray" title="Probabilidade de fechamento">
              {probabilidade}%
            </span>
          )}
        </div>
        {probabilidade !== null && (
          <div className="mt-1.5 h-1 w-full rounded-full bg-panel-bg overflow-hidden">
            <div className="h-full rounded-full bg-brand" style={{ width: `${probabilidade}%` }} />
          </div>
        )}
      </div>

      {/* Rodapé: responsável, prazo, tempo na etapa, atividade */}
      <div className="mt-2.5 pt-2 border-t border-border-soft flex items-center gap-2">
        <span
          title={responsavel}
          className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[9.5px] font-semibold ${
            semResponsavel ? "bg-panel-bg text-text-faint" : "bg-brand-soft text-brand-strong"
          }`}
        >
          {semResponsavel ? "?" : iniciais(responsavel)}
        </span>
        <span className="flex-1 min-w-0 truncate text-[11.5px] text-text-gray">
          {semResponsavel ? "Sem responsável" : responsavel.split(/\s+/)[0]}
        </span>
        {dataPrazo && diaMes(dataPrazo) && (
          <span
            title={aberto ? (atrasado ? "Previsão de fechamento atrasada" : "Previsão de fechamento") : "Data de fechamento"}
            className={`inline-flex items-center gap-1 text-[11px] ${
              atrasado ? "text-red font-semibold" : "text-text-faint"
            }`}
          >
            <CalendarClock size={12} />
            {diaMes(dataPrazo)}
          </span>
        )}
        {parado !== null && (
          <span
            title={`Há ${parado} dia(s) nesta etapa`}
            className={`inline-flex items-center gap-1 text-[11px] ${paradoClasse}`}
          >
            <Clock size={12} />
            {textoDias(parado)}
          </span>
        )}
        <AtividadeIcone temAtividade={temAtividade} />
      </div>
    </div>
  );
}

function Column({
  stageId,
  label,
  deals,
  atividadesStatus,
  onOpenDeal,
}: {
  stageId: string;
  label: string;
  deals: Deal[];
  atividadesStatus: Record<string, boolean>;
  onOpenDeal: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  const total = deals.reduce((sum, d) => sum + d.valor, 0);

  return (
    <div className="flex flex-col w-72 shrink-0 border-r border-border-soft last:border-r-0 pr-4 last:pr-0">
      <div className="px-0.5 mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-text-dark truncate">{label}</h3>
          <span className="text-[11px] text-text-faint">{formatBRL(total)}</span>
        </div>
        <span className="shrink-0 rounded-full border border-border-soft bg-panel-bg px-2 py-0.5 text-[11px] font-semibold text-text-gray">
          {deals.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2.5 min-h-[140px] rounded-xl p-1 flex-1 transition-colors ${
          isOver ? "bg-brand-soft" : ""
        }`}
      >
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            temAtividade={atividadesStatus[deal.id]}
            onOpen={onOpenDeal}
          />
        ))}
        {deals.length === 0 && (
          <div className="flex-1 min-h-[96px] rounded-xl border border-dashed border-border flex items-center justify-center text-[11.5px] text-text-faint">
            Solte um negócio aqui
          </div>
        )}
      </div>
    </div>
  );
}

export default function FunnelBoard() {
  const { deals, dealsLoading, addDeal, updateDeal, currentUser } = useCrmData();
  const visibleFunnels = useMemo(
    () => FUNNELS.filter((f) => hasPermission(currentUser.cargoId, `funil.${f.id}`)),
    [currentUser.cargoId]
  );
  const [selectedFunnelId, setSelectedFunnelId] = useState<FunnelId>(() => visibleFunnels[0]?.id ?? FUNNELS[0].id);
  // Se o usuário logado trocar e o funil selecionado deixar de ser permitido, cai pro primeiro visível.
  const funnelId = visibleFunnels.some((f) => f.id === selectedFunnelId)
    ? selectedFunnelId
    : visibleFunnels[0]?.id ?? FUNNELS[0].id;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openDealId, setOpenDealId] = useState<string | null>(null);
  const [duplicatingDeal, setDuplicatingDeal] = useState<Deal | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("todos");
  const [atividadesStatus, setAtividadesStatus] = useState<Record<string, boolean>>({});

  // Abrir um negócio registra um passo no histórico do navegador, para que o
  // botão "voltar" (ou o X do painel) retorne ao funil exatamente como estava
  // — mesmo funil, filtro e modo de visão — em vez de voltar ao início.
  function abrirDeal(id: string) {
    if (typeof window !== "undefined") {
      window.history.pushState({ dealAberto: id }, "", window.location.href);
    }
    setOpenDealId(id);
  }

  function fecharDeal() {
    if (typeof window !== "undefined" && window.history.state?.dealAberto) {
      window.history.back();
    } else {
      setOpenDealId(null);
    }
  }

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      if (!event.state?.dealAberto) {
        setOpenDealId(null);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sino de notificações: abre o negócio pedido, seja chegando em /funil?negocio=ID
  // ou por evento quando o funil já está aberto.
  useEffect(() => {
    const idDaUrl = new URLSearchParams(window.location.search).get("negocio");
    if (idDaUrl) {
      abrirDeal(idDaUrl);
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
    function handleAbrirNegocio(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (id) abrirDeal(id);
    }
    window.addEventListener("abrir-negocio", handleAbrirNegocio);
    return () => window.removeEventListener("abrir-negocio", handleAbrirNegocio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const funnel = FUNNELS.find((f) => f.id === funnelId)!;

  const totalsById = useMemo(() => {
    const result: Record<string, { count: number; total: number }> = {};
    FUNNELS.forEach((f) => {
      const list = deals.filter((d) => d.funnelId === f.id);
      result[f.id] = {
        count: list.length,
        total: list.reduce((sum, d) => sum + d.valor, 0),
      };
    });
    return result;
  }, [deals]);

  const currentDeals = deals.filter((d) => d.funnelId === funnelId);
  const activeDeal = deals.find((d) => d.id === activeId);

  const responsaveis = useMemo(
    () => Array.from(new Set(currentDeals.map((d) => d.responsavel))).sort(),
    [currentDeals]
  );

  const dealsFiltrados = useMemo(
    () =>
      filtroResponsavel === "todos"
        ? currentDeals
        : currentDeals.filter((d) => d.responsavel === filtroResponsavel),
    [currentDeals, filtroResponsavel]
  );

  const dealsByStageFiltrado = useMemo(() => {
    const map = new Map<string, Deal[]>();
    funnel.stages.forEach((s) => map.set(s.id, []));
    dealsFiltrados.forEach((d) => map.get(d.stageId)?.push(d));
    return map;
  }, [dealsFiltrados, funnel]);

  // Ao trocar de funil (ou os negócios visíveis mudarem), busca no Firestore
  // quais desses negócios já têm ao menos uma atividade registrada.
  useEffect(() => {
    const ids = currentDeals.map((d) => d.id);
    if (ids.length === 0) return;
    let cancelado = false;
    checarAtividadesPorDeals(ids)
      .then((status) => {
        if (!cancelado) setAtividadesStatus((prev) => ({ ...prev, ...status }));
      })
      .catch((err) => console.error(err));
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDeals.map((d) => d.id).join(",")]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const newStage = String(over.id);
    updateDeal(String(active.id), { stageId: newStage });
  }

  async function handleCreate(newDeal: Omit<Deal, "id" | "createdAt">): Promise<Deal> {
    try {
      return await addDeal(newDeal);
    } finally {
      // Fecha mesmo se algum anexo falhar: o negócio já foi criado (evita duplicar ao clicar de novo).
      setModalOpen(false);
    }
  }

  function handleDuplicateRequest(deal: Deal) {
    fecharDeal();
    setDuplicatingDeal(deal);
  }

  async function handleCreateDuplicate(newDeal: Omit<Deal, "id" | "createdAt">) {
    let criado: Deal;
    try {
      criado = await addDeal(newDeal);
    } catch (err) {
      if (err instanceof Error && err.name === "AnexosFalharam") setDuplicatingDeal(null);
      throw err;
    }
    // O formulário de "novo negócio" não edita esses campos — copiamos do
    // original manualmente pra "Duplicar negócio" não perder essa informação.
    if (duplicatingDeal) {
      const extras: Partial<Deal> = {};
      if (duplicatingDeal.perfilCliente) extras.perfilCliente = duplicatingDeal.perfilCliente;
      if (duplicatingDeal.concessionaria) extras.concessionaria = duplicatingDeal.concessionaria;
      if (duplicatingDeal.npsVenda !== undefined) extras.npsVenda = duplicatingDeal.npsVenda;
      if (duplicatingDeal.npsInstalacao !== undefined) extras.npsInstalacao = duplicatingDeal.npsInstalacao;
      if (duplicatingDeal.npsPosVenda !== undefined) extras.npsPosVenda = duplicatingDeal.npsPosVenda;
      if (Object.keys(extras).length > 0) updateDeal(criado.id, extras);
    }
    setDuplicatingDeal(null);
  }

  return (
    <div>
      <h1 className="font-display font-bold text-xl text-text-dark mb-4">Funil de Vendas</h1>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <FunnelSwitcher
          funnels={visibleFunnels}
          activeId={funnelId}
          totalsById={totalsById}
          onChange={(id) => setSelectedFunnelId(id as FunnelId)}
        />

        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-sm text-text-gray">
            {dealsFiltrados.length} resultados
            <Info size={13} className="text-text-faint" />
          </span>
          <div className="flex items-center rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-9 w-9 flex items-center justify-center transition-colors ${
                viewMode === "grid"
                  ? "bg-brand-soft text-brand-strong"
                  : "text-text-faint hover:text-text-gray"
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-9 w-9 flex items-center justify-center border-l border-border transition-colors ${
                viewMode === "list"
                  ? "bg-brand-soft text-brand-strong"
                  : "text-text-faint hover:text-text-gray"
              }`}
            >
              <List size={15} />
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setFiltrosAbertos((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm transition-colors ${
                filtroResponsavel !== "todos"
                  ? "border-brand text-brand-strong bg-brand-soft"
                  : "border-border text-text-gray hover:text-text-dark"
              }`}
            >
              <Filter size={14} />
              Filtros
              {filtroResponsavel !== "todos" && (
                <span className="h-1.5 w-1.5 rounded-full bg-brand-strong" />
              )}
            </button>
            {filtrosAbertos && (
              <div className="absolute right-0 top-11 z-20 w-64 rounded-xl border border-border bg-card-bg shadow-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-text-dark">Filtrar negócios</span>
                  <button
                    onClick={() => setFiltrosAbertos(false)}
                    className="text-text-faint hover:text-text-gray"
                  >
                    <X size={14} />
                  </button>
                </div>
                <label className="block text-[11px] font-semibold text-text-gray mb-1.5 tracking-wide">
                  RESPONSÁVEL
                </label>
                <select
                  value={filtroResponsavel}
                  onChange={(e) => setFiltroResponsavel(e.target.value)}
                  className="w-full rounded-xl border border-border bg-panel-bg px-3 py-2 text-sm text-text-dark outline-none focus:border-brand"
                >
                  <option value="todos">Todos</option>
                  {responsaveis.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {filtroResponsavel !== "todos" && (
                  <button
                    onClick={() => setFiltroResponsavel("todos")}
                    className="mt-3 text-xs text-text-faint hover:text-text-gray underline"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-press flex items-center gap-1.5 rounded-xl bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors"
          >
            <Plus size={16} />
            Novo negócio
          </button>
          <button className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-text-gray hover:text-text-dark transition-colors">
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="border-b border-border mb-5" />

      {dealsLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((col) => (
            <div key={col} className="flex flex-col w-72 shrink-0 gap-3">
              <div className="h-3.5 w-24 rounded animate-skeleton bg-border-soft" />
              <div className="h-3 w-16 rounded animate-skeleton bg-border-soft" />
              {[0, 1].map((row) => (
                <div
                  key={row}
                  className="rounded-xl border border-border-soft bg-card-bg p-3.5 space-y-2.5"
                  style={{ animationDelay: `${(col * 2 + row) * 60}ms` }}
                >
                  <div className="h-3.5 w-4/5 rounded animate-skeleton bg-border-soft" />
                  <div className="h-3 w-2/5 rounded animate-skeleton bg-border-soft" />
                  <div className="h-3.5 w-1/3 rounded animate-skeleton bg-border-soft" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-xl border border-border overflow-hidden bg-card-bg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-faint">
                <th className="px-5 py-3 font-semibold">Negócio</th>
                <th className="px-5 py-3 font-semibold">Etapa</th>
                <th className="px-5 py-3 font-semibold">Responsável</th>
                <th className="px-5 py-3 font-semibold">Valor</th>
                <th className="px-5 py-3 font-semibold">Atividade</th>
              </tr>
            </thead>
            <tbody>
              {dealsFiltrados.map((deal) => {
                const stage = funnel.stages.find((s) => s.id === deal.stageId);
                const temAtividade = atividadesStatus[deal.id];
                return (
                  <tr
                    key={deal.id}
                    onClick={() => abrirDeal(deal.id)}
                    className="border-b border-border-soft last:border-0 hover:bg-panel-bg/60 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-text-dark">{deal.titulo}</td>
                    <td className="px-5 py-3.5 text-text-gray">{stage?.label ?? deal.stageId}</td>
                    <td className="px-5 py-3.5 text-text-gray">{deal.responsavel}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-text-dark">
                      {formatBRL(deal.valor)}
                    </td>
                    <td className="px-5 py-3.5">
                      <AtividadeIcone temAtividade={temAtividade} />
                    </td>
                  </tr>
                );
              })}
              {dealsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-faint">
                    Nenhum negócio encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
      <DndContext
        key={funnelId}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {funnel.stages.map((stage) => (
            <Column
              key={stage.id}
              stageId={stage.id}
              label={stage.label}
              deals={dealsByStageFiltrado.get(stage.id) ?? []}
              atividadesStatus={atividadesStatus}
              onOpenDeal={abrirDeal}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} dragging /> : null}
        </DragOverlay>
      </DndContext>
      )}

      {modalOpen && (
        <NewDealModal
          funnel={funnel}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {duplicatingDeal && (
        <NewDealModal
          funnel={FUNNELS.find((f) => f.id === duplicatingDeal.funnelId) ?? funnel}
          initialDeal={duplicatingDeal}
          onClose={() => setDuplicatingDeal(null)}
          onCreate={handleCreateDuplicate}
        />
      )}

      {openDealId && (
        <DealDetailPanel
          dealId={openDealId}
          onClose={fecharDeal}
          onDuplicate={handleDuplicateRequest}
          onAtividadesStatusChange={(id, pendente) =>
            setAtividadesStatus((prev) => ({ ...prev, [id]: pendente }))
          }
        />
      )}
    </div>
  );
}
