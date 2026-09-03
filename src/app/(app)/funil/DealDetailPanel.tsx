"use client";

import { useMemo, useState } from "react";
import {
  X,
  ChevronRight,
  ChevronDown,
  Pencil,
  Wallet,
  SlidersHorizontal,
  Check,
  Ban,
  MoreVertical,
  FileOutput,
  Building2,
  User2,
  Clock,
  CalendarDays,
} from "lucide-react";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { FUNNELS } from "@/lib/funnels";
import { TEMPERATURA_LABEL } from "@/lib/types";
import { formatBRL } from "@/lib/masks";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useToast } from "@/components/ui/Toast";

type TimelineTipo = "registro" | "nota" | "atividade";

type TimelineEntry = {
  id: string;
  tipo: TimelineTipo;
  titulo: string;
  detalhe?: string;
  autor: string;
  data: Date;
};

function diasDesde(dateStr?: string) {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

function formatDateTime(d: Date) {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-[13px]">
      <span className="text-text-faint shrink-0">{label}</span>
      <span className="text-text-dark font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function SidebarCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-display font-semibold text-[13px] text-text-dark">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DealDetailPanel({
  dealId,
  onClose,
}: {
  dealId: string;
  onClose: () => void;
}) {
  const { deals, getOrganizacao, getPessoa, updateDeal } = useCrmData();
  const { showToast } = useToast();

  const deal = deals.find((d) => d.id === dealId);

  const [notaValue, setNotaValue] = useState("");
  const [abaTimeline, setAbaTimeline] = useState<"todos" | "notas" | "atividades" | "registros">("todos");
  const [abaPrincipal, setAbaPrincipal] = useState<"anotacoes" | "atividades">("anotacoes");
  const [showInfoCliente, setShowInfoCliente] = useState(true);
  const [showFoco, setShowFoco] = useState(false);

  const [extraEntries, setExtraEntries] = useState<TimelineEntry[]>([]);

  const funnel = deal ? FUNNELS.find((f) => f.id === deal.funnelId) : undefined;
  const organizacao = getOrganizacao(deal?.organizacaoId);
  const pessoa = getPessoa(deal?.pessoaId);
  const currentStageIndex = deal ? funnel?.stages.findIndex((s) => s.id === deal.stageId) ?? 0 : 0;
  const idade = diasDesde(deal?.createdAt);

  const timeline: TimelineEntry[] = useMemo(() => {
    if (!deal) return [];
    const seed: TimelineEntry[] = [
      {
        id: "seed-criado",
        tipo: "registro",
        titulo: "Registro de Negócio criado",
        detalhe: deal.titulo,
        autor: deal.responsavel,
        data: deal.createdAt ? new Date(deal.createdAt) : new Date(),
      },
    ];
    return [...seed, ...extraEntries].sort((a, b) => b.data.getTime() - a.data.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id, deal?.createdAt, deal?.titulo, deal?.responsavel, extraEntries]);

  const timelineFiltrada = timeline.filter((t) => {
    if (abaTimeline === "todos") return true;
    if (abaTimeline === "notas") return t.tipo === "nota";
    if (abaTimeline === "atividades") return t.tipo === "atividade";
    return t.tipo === "registro";
  });

  if (!deal) return null;

  function addEntry(entry: Omit<TimelineEntry, "id" | "data">) {
    setExtraEntries((prev) => [{ ...entry, id: `t${Date.now()}`, data: new Date() }, ...prev]);
  }

  function handleStatus(status: "ganho" | "perdido") {
    updateDeal(deal!.id, { status });
    addEntry({
      tipo: "registro",
      titulo: `Negócio marcado como ${status === "ganho" ? "Ganho" : "Perdido"}`,
      autor: deal!.responsavel,
    });
    showToast(
      status === "ganho" ? "Negócio marcado como ganho 🎉" : "Negócio marcado como perdido",
      status === "ganho" ? "success" : "info"
    );
  }

  function handleStageClick(stageId: string) {
    if (stageId === deal!.stageId) return;
    const stage = funnel?.stages.find((s) => s.id === stageId);
    updateDeal(deal!.id, { stageId });
    addEntry({
      tipo: "registro",
      titulo: `Etapa alterada para "${stage?.label ?? stageId}"`,
      autor: deal!.responsavel,
    });
  }

  function handleSaveNota() {
    if (!notaValue.trim()) return;
    addEntry({ tipo: "nota", titulo: "Nota adicionada", detalhe: notaValue.trim(), autor: deal!.responsavel });
    setNotaValue("");
    showToast("Nota salva com sucesso");
  }

  const customFields: { label: string; value?: React.ReactNode }[] = [
    { label: "Perfil do cliente", value: organizacao ? "Empresarial" : "Residencial" },
    {
      label: "Prioridade de instalação",
      value: deal.prioridade ? deal.prioridade[0].toUpperCase() + deal.prioridade.slice(1) : undefined,
    },
    { label: "Tipo de telhado", value: deal.tipoTelhado },
    { label: "Concessionária", value: deal.distribuidora },
    { label: "Fase da rede", value: deal.fase },
    { label: "Consumo médio de energia (kWh)", value: deal.consumoMedio },
    { label: "Potência do sistema (kWp)", value: deal.potenciaSistema },
    { label: "Tensão da rede", value: deal.tensao },
    { label: "Validade da proposta", value: deal.validadeProposta },
    { label: "Drone", value: deal.drone ? "Sim" : undefined },
    { label: "Conta Contrato", value: deal.contaContrato },
    { label: "Carga instalada", value: deal.cargaInstalada },
    { label: "Troca de titularidade", value: deal.trocaTitularidade ? "Sim" : undefined },
    { label: "Valor do Projeto", value: deal.valorProjeto ? formatBRL(deal.valorProjeto) : undefined },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-page-bg flex flex-col animate-overlay-in">
      {/* Breadcrumb bar */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-border-soft shrink-0 bg-card-bg">
        <div className="flex items-center gap-1.5 text-[13px] text-text-faint min-w-0">
          <button onClick={onClose} className="hover:text-text-dark transition-colors">
            Funil
          </button>
          <ChevronRight size={13} />
          <span>Negócio</span>
          <ChevronRight size={13} />
          <span className="text-text-dark font-medium truncate">{deal.titulo}</span>
        </div>
        <button onClick={onClose} className="text-text-faint hover:text-text-gray shrink-0" aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border-soft shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h1 className="font-display font-bold text-xl text-text-dark flex items-center gap-2">
            {deal.titulo}
            <Pencil size={14} className="text-text-faint" />
          </h1>
          <div className="flex items-center gap-2">
            {funnel && (
              <span className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg bg-panel-bg text-text-gray border border-border">
                {funnel.name}
              </span>
            )}
            <button
              onClick={() => handleStatus("ganho")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                deal.status === "ganho"
                  ? "bg-badge-green-text text-white"
                  : "bg-badge-green-bg text-badge-green-text hover:opacity-80"
              }`}
            >
              <Check size={14} />
              Ganho
            </button>
            <button
              onClick={() => handleStatus("perdido")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                deal.status === "perdido"
                  ? "bg-badge-red-text text-white"
                  : "bg-badge-red-bg text-badge-red-text hover:opacity-80"
              }`}
            >
              <Ban size={14} />
              Perdido
            </button>
            <button className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-faint hover:text-text-gray transition-colors">
              <MoreVertical size={15} />
            </button>
            <button
              onClick={() => showToast("Gerando proposta...", "info")}
              className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-3.5 py-1.5 hover:bg-brand-strong transition-colors"
            >
              <FileOutput size={14} />
              Gerar proposta
            </button>
          </div>
        </div>

        {/* Stage progress */}
        {funnel && (
          <div className="flex items-center">
            {funnel.stages.map((stage, idx) => (
              <button
                key={stage.id}
                onClick={() => handleStageClick(stage.id)}
                title={stage.label}
                className="group flex-1 flex flex-col items-center gap-1.5 relative"
              >
                <div
                  className={`h-1.5 w-full absolute top-1.5 left-0 -translate-y-1/2 ${
                    idx === 0 ? "rounded-l-full" : ""
                  } ${idx === funnel.stages.length - 1 ? "rounded-r-full" : ""} ${
                    idx <= currentStageIndex ? "bg-brand" : "bg-border"
                  }`}
                  style={{ zIndex: 0 }}
                />
                <span
                  className={`relative z-10 h-3 w-3 rounded-full border-2 transition-colors ${
                    idx <= currentStageIndex
                      ? "bg-brand border-brand"
                      : "bg-card-bg border-border group-hover:border-brand"
                  }`}
                />
                <span
                  className={`text-[10.5px] leading-tight text-center px-1 ${
                    idx === currentStageIndex ? "text-brand-strong font-semibold" : "text-text-faint"
                  }`}
                >
                  {stage.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[300px] shrink-0 border-r border-border-soft overflow-y-auto p-4 space-y-4 bg-panel-bg/40">
          <button
            onClick={() => setShowInfoCliente((v) => !v)}
            className="w-full flex items-center justify-between text-[13px] font-semibold text-text-dark px-0.5"
          >
            Informações do cliente
            <ChevronDown size={14} className={`transition-transform ${showInfoCliente ? "" : "-rotate-90"}`} />
          </button>

          {showInfoCliente && (
            <>
              <SidebarCard title="Negócio" action={<Pencil size={13} className="text-text-faint" />}>
                <InfoRow label="Valor" value={formatBRL(deal.valor)} />
                <InfoRow label="Nome" value={deal.titulo} />
                <InfoRow label="Previsão de fechamento" value={deal.previsaoFechamento} />
                <InfoRow label="Funil" value={funnel?.name} />
                <InfoRow label="Etapa do funil" value={funnel?.stages[currentStageIndex]?.label} />
                <InfoRow
                  label="Organização"
                  value={
                    organizacao ? (
                      <span className="inline-flex items-center gap-1 text-brand-strong">
                        <Building2 size={12} />
                        {organizacao.nome}
                      </span>
                    ) : undefined
                  }
                />
                <InfoRow
                  label="Pessoa de contato"
                  value={
                    pessoa ? (
                      <span className="inline-flex items-center gap-1 text-brand-strong">
                        <User2 size={12} />
                        {pessoa.nome}
                      </span>
                    ) : undefined
                  }
                />
                <InfoRow label="Responsável" value={deal.responsavel} />
                <InfoRow
                  label="Idade do negócio"
                  value={idade !== null ? `${idade} dia${idade !== 1 ? "s" : ""}` : undefined}
                />
                <InfoRow label="Data de início" value={deal.createdAt} />
                <InfoRow label="Canal de origem" value={deal.canalOrigem} />
                {deal.temperatura && <InfoRow label="Temperatura" value={TEMPERATURA_LABEL[deal.temperatura]} />}
              </SidebarCard>

              <SidebarCard title="Financiamento">
                <button
                  onClick={() => showToast("Financiamento ainda não implementado", "info")}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-[13px] font-medium text-brand-strong hover:border-brand hover:bg-brand-soft transition-colors"
                >
                  <Wallet size={14} />
                  Novo financiamento
                </button>
              </SidebarCard>

              <SidebarCard title="Personalizados" action={<SlidersHorizontal size={13} className="text-text-faint" />}>
                <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-1">
                  Campos sem grupo
                </p>
                {customFields.map((f) => (
                  <InfoRow key={f.label} label={f.label} value={f.value} />
                ))}
              </SidebarCard>
            </>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-5 border-b border-border-soft mb-4">
            {(["anotacoes", "atividades"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setAbaPrincipal(tab)}
                className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                  abaPrincipal === tab
                    ? "border-brand text-brand-strong"
                    : "border-transparent text-text-faint hover:text-text-gray"
                }`}
              >
                {tab === "anotacoes" ? "Anotações" : "Atividades"}
              </button>
            ))}
          </div>

          {abaPrincipal === "anotacoes" ? (
            <div className="space-y-6 max-w-3xl">
              <div>
                <RichTextEditor
                  value={notaValue}
                  onChange={setNotaValue}
                  placeholder="Escreva uma anotação sobre este negócio..."
                  rows={4}
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => setNotaValue("")}
                    className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-gray hover:bg-panel-bg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNota}
                    className="rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setShowFoco((v) => !v)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-text-dark mb-2"
                >
                  Foco
                  <ChevronDown size={13} className={`transition-transform ${showFoco ? "" : "-rotate-90"}`} />
                </button>
                {showFoco && (
                  <div className="rounded-lg border border-dashed border-border py-6 text-center text-[12.5px] text-text-faint">
                    Nenhuma atividade em foco
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-text-dark mb-3">
                  Linha do tempo
                  <ChevronDown size={13} />
                </div>
                <div className="flex items-center gap-4 border-b border-border-soft mb-3 text-[12.5px]">
                  {(
                    [
                      ["todos", `Todos (${timeline.length})`],
                      ["notas", `Notas (${timeline.filter((t) => t.tipo === "nota").length})`],
                      ["atividades", `Atividades (${timeline.filter((t) => t.tipo === "atividade").length})`],
                      ["registros", `Registros (${timeline.filter((t) => t.tipo === "registro").length})`],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setAbaTimeline(key)}
                      className={`pb-2 border-b-2 transition-colors ${
                        abaTimeline === key
                          ? "border-brand text-brand-strong font-medium"
                          : "border-transparent text-text-faint hover:text-text-gray"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {timelineFiltrada.length === 0 && (
                    <p className="text-[12.5px] text-text-faint py-4 text-center">Nenhum registro por aqui ainda.</p>
                  )}
                  {timelineFiltrada.map((t) => (
                    <div key={t.id} className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-brand-soft text-brand-strong flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-text-dark">{t.titulo}</p>
                        {t.detalhe && <p className="text-[12.5px] text-text-gray mt-0.5">{t.detalhe}</p>}
                        <p className="text-[11.5px] text-text-faint mt-1 flex items-center gap-1">
                          <CalendarDays size={11} />
                          {formatDateTime(t.data)} · {t.autor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-12 text-center text-[13px] text-text-faint max-w-3xl">
              Nenhuma atividade agendada para este negócio.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
