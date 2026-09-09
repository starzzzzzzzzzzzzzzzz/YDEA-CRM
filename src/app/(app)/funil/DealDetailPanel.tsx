"use client";

import { useEffect, useMemo, useState } from "react";
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
  Copy,
  Trash2,
  Download,
  Loader2,
  Plus,
} from "lucide-react";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { useAuth } from "@/lib/store/AuthContext";
import { FUNNELS } from "@/lib/funnels";
import {
  TEMPERATURA_LABEL,
  PERFIL_CLIENTE_LABEL,
  Anotacao,
  Atividade,
  AtividadeTipo,
  ATIVIDADE_TIPO_LABEL,
  DealPrioridade,
} from "@/lib/types";
import { formatBRL } from "@/lib/masks";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useToast } from "@/components/ui/Toast";
import { fetchAnotacoes, addAnotacao } from "@/lib/firebase/anotacoes";
import { fetchAtividades, addAtividade, marcarAtividadeConcluida } from "@/lib/firebase/atividades";
import { fetchAllUsuarios, UsuarioDoc } from "@/lib/firebase/firestore";
import DocumentUploadGrid from "./DocumentUploadGrid";

function diasDesde(dateStr?: string) {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
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
  onOpenDeal,
}: {
  dealId: string;
  onClose: () => void;
  onOpenDeal?: (id: string) => void;
}) {
  const { deals, getOrganizacao, getPessoa, updateDeal, removeDeal, duplicateDeal } = useCrmData();
  const { user } = useAuth();
  const { showToast } = useToast();

  const deal = deals.find((d) => d.id === dealId);

  const [notaValue, setNotaValue] = useState("");
  const [salvandoNota, setSalvandoNota] = useState(false);
  const [abaPrincipal, setAbaPrincipal] = useState<"anotacoes" | "atividades">("anotacoes");
  const [showInfoCliente, setShowInfoCliente] = useState(true);
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [motivoPerdaAberto, setMotivoPerdaAberto] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [duplicando, setDuplicando] = useState(false);

  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioDoc[]>([]);
  const [novaAtividadeAberta, setNovaAtividadeAberta] = useState(false);

  useEffect(() => {
    if (!dealId) return;
    fetchAnotacoes(dealId).then(setAnotacoes).catch((err) => console.error(err));
    fetchAtividades(dealId).then(setAtividades).catch((err) => console.error(err));
    fetchAllUsuarios().then(setUsuarios).catch((err) => console.error(err));
  }, [dealId]);

  const funnel = deal ? FUNNELS.find((f) => f.id === deal.funnelId) : undefined;
  const organizacao = getOrganizacao(deal?.organizacaoId);
  const pessoa = getPessoa(deal?.pessoaId);
  const currentStageIndex = deal ? funnel?.stages.findIndex((s) => s.id === deal.stageId) ?? 0 : 0;
  const idade = diasDesde(deal?.createdAt);

  if (!deal) return null;

  async function handleStatus(status: "ganho" | "perdido") {
    if (status === "perdido" && !motivoPerdaAberto) {
      setMotivoPerdaAberto(true);
      return;
    }
    updateDeal(deal!.id, {
      status,
      fechadoEm: new Date().toISOString(),
      motivoPerda: status === "perdido" ? motivoPerda || undefined : undefined,
    });
    setMotivoPerdaAberto(false);
    setMotivoPerda("");
    showToast(
      status === "ganho" ? "Negócio marcado como ganho 🎉" : "Negócio marcado como perdido",
      status === "ganho" ? "success" : "info"
    );
  }

  function handleStageClick(stageId: string) {
    if (stageId === deal!.stageId) return;
    updateDeal(deal!.id, { stageId });
  }

  async function handleSaveNota() {
    if (!notaValue.trim() || !user) return;
    setSalvandoNota(true);
    try {
      const nova = await addAnotacao(deal!.id, {
        texto: notaValue.trim(),
        autorId: user.id,
        autorNome: user.nome,
      });
      setAnotacoes((prev) => [nova, ...prev]);
      setNotaValue("");
      showToast("Anotação salva com sucesso");
    } catch (err) {
      console.error(err);
      showToast("Não foi possível salvar a anotação", "info");
    } finally {
      setSalvandoNota(false);
    }
  }

  function handleTrocarResponsavel(usuario: UsuarioDoc) {
    updateDeal(deal!.id, { responsavel: usuario.nome });
    setOwnerMenuOpen(false);
    showToast(`Responsável alterado para ${usuario.nome}`);
  }

  function handleExportarAnotacoes() {
    const texto = anotacoes
      .map((a) => `[${formatDateTime(a.criadoEm)}] ${a.autorNome}:\n${a.texto}\n`)
      .join("\n---\n\n");
    const blob = new Blob([texto || "Nenhuma anotação registrada ainda."], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anotacoes-${deal!.titulo.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  }

  async function handleDuplicar() {
    setDuplicando(true);
    try {
      const copia = await duplicateDeal(deal!);
      showToast("Negócio duplicado");
      setMenuOpen(false);
      onOpenDeal?.(copia.id);
    } catch (err) {
      console.error(err);
      showToast("Não foi possível duplicar o negócio", "info");
    } finally {
      setDuplicando(false);
    }
  }

  async function handleExcluir() {
    try {
      await removeDeal(deal!.id);
      showToast("Negócio excluído");
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Não foi possível excluir o negócio", "info");
    }
  }

  const customFields: { label: string; value?: React.ReactNode }[] = [
    {
      label: "Perfil do cliente",
      value: deal.perfilCliente ? PERFIL_CLIENTE_LABEL[deal.perfilCliente] : undefined,
    },
    {
      label: "Prioridade de instalação",
      value: deal.prioridade ? deal.prioridade[0].toUpperCase() + deal.prioridade.slice(1) : undefined,
    },
    { label: "Tipo de telhado", value: deal.tipoTelhado },
    { label: "Concessionária", value: deal.concessionaria },
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
    { label: "NPS Venda", value: deal.npsVenda },
    { label: "NPS Instalação", value: deal.npsInstalacao },
    { label: "NPS Pós-venda", value: deal.npsPosVenda },
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

            {/* Proprietário / responsável */}
            <div className="relative">
              <button
                onClick={() => setOwnerMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] font-medium text-text-gray hover:bg-panel-bg transition-colors"
              >
                <span className="h-5 w-5 rounded-full bg-brand-soft text-brand-strong text-[10px] font-bold flex items-center justify-center">
                  {deal.responsavel.charAt(0)}
                </span>
                {deal.responsavel}
                <ChevronDown size={13} />
              </button>
              {ownerMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOwnerMenuOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-56 rounded-lg border border-border bg-card-bg shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto">
                    {usuarios.length === 0 && (
                      <p className="px-3 py-2.5 text-[12px] text-text-faint">Carregando equipe...</p>
                    )}
                    {usuarios.map((u) => (
                      <button
                        key={u.email}
                        onClick={() => handleTrocarResponsavel(u)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-panel-bg transition-colors"
                      >
                        <span className="h-5 w-5 rounded-full bg-panel-bg text-text-gray text-[10px] font-bold flex items-center justify-center shrink-0">
                          {u.iniciais}
                        </span>
                        <span className="truncate">{u.nome}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

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

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-faint hover:text-text-gray transition-colors"
              >
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-64 rounded-lg border border-border bg-card-bg shadow-lg z-50 overflow-hidden">
                    <button
                      onClick={handleExportarAnotacoes}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-text-gray hover:bg-panel-bg transition-colors"
                    >
                      <Download size={14} />
                      Exportar anotações do negócio
                    </button>
                    <button
                      onClick={handleDuplicar}
                      disabled={duplicando}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-text-gray hover:bg-panel-bg transition-colors disabled:opacity-60"
                    >
                      {duplicando ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                      Duplicar negócio
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmandoExclusao(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      Excluir negócio
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => showToast("Propostas ainda não implementadas — fica pra próxima fase", "info")}
              className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-3.5 py-1.5 hover:bg-brand-strong transition-colors"
            >
              <FileOutput size={14} />
              Gerar proposta
            </button>
          </div>
        </div>

        {motivoPerdaAberto && (
          <div className="flex items-center gap-2 mb-4 bg-panel-bg border border-border rounded-lg p-2.5">
            <input
              autoFocus
              value={motivoPerda}
              onChange={(e) => setMotivoPerda(e.target.value)}
              placeholder="Motivo da perda (opcional)"
              className="flex-1 bg-transparent text-[13px] text-text-dark outline-none placeholder:text-text-faint"
            />
            <button
              onClick={() => handleStatus("perdido")}
              className="rounded-md bg-badge-red-text text-white text-[12.5px] font-semibold px-3 py-1.5"
            >
              Confirmar perda
            </button>
            <button
              onClick={() => {
                setMotivoPerdaAberto(false);
                setMotivoPerda("");
              }}
              className="text-[12.5px] text-text-faint px-2"
            >
              Cancelar
            </button>
          </div>
        )}

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
                {deal.status === "perdido" && deal.motivoPerda && (
                  <InfoRow label="Motivo da perda" value={deal.motivoPerda} />
                )}
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

              <SidebarCard
                title="Documentos e fotos"
                action={
                  <button
                    onClick={() => setShowDocumentos((v) => !v)}
                    className="text-text-faint hover:text-text-gray"
                  >
                    <ChevronDown size={14} className={`transition-transform ${showDocumentos ? "" : "-rotate-90"}`} />
                  </button>
                }
              >
                {showDocumentos ? (
                  <DocumentosDoNegocio dealId={deal.id} />
                ) : (
                  <p className="text-[12px] text-text-faint">
                    {(deal.documentos?.length ?? 0)} arquivo(s) anexado(s)
                  </p>
                )}
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
                {tab === "anotacoes" ? `Anotações (${anotacoes.length})` : `Atividades (${atividades.length})`}
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
                    disabled={salvandoNota}
                    className="rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors disabled:opacity-60"
                  >
                    {salvandoNota ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {anotacoes.length === 0 && (
                  <p className="text-[12.5px] text-text-faint py-4 text-center">
                    Nenhuma anotação registrada ainda.
                  </p>
                )}
                {anotacoes.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-brand-soft text-brand-strong flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-text-dark whitespace-pre-wrap">{a.texto}</p>
                      <p className="text-[11.5px] text-text-faint mt-1 flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatDateTime(a.criadoEm)} · {a.autorNome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <AtividadesTab
              dealId={deal.id}
              atividades={atividades}
              setAtividades={setAtividades}
              usuarios={usuarios}
              currentUser={user}
              open={novaAtividadeAberta}
              setOpen={setNovaAtividadeAberta}
            />
          )}
        </main>
      </div>

      {confirmandoExclusao && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-card-bg rounded-xl border border-border p-5 max-w-sm w-full">
            <h3 className="font-display font-semibold text-[15px] text-text-dark mb-2">Excluir negócio?</h3>
            <p className="text-[13px] text-text-gray mb-5">
              Essa ação não pode ser desfeita. &quot;{deal.titulo}&quot; será removido permanentemente do
              Firestore.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmandoExclusao(false)}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-gray hover:bg-panel-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluir}
                className="rounded-lg bg-red-600 text-white font-semibold text-sm px-4 py-2 hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentosDoNegocio({ dealId }: { dealId: string }) {
  const { deals, updateDeal } = useCrmData();
  const deal = deals.find((d) => d.id === dealId);
  if (!deal) return null;
  return (
    <DocumentUploadGrid
      dealId={dealId}
      documentos={deal.documentos ?? []}
      onChange={(docs) => updateDeal(dealId, { documentos: docs })}
    />
  );
}

function AtividadesTab({
  dealId,
  atividades,
  setAtividades,
  usuarios,
  currentUser,
  open,
  setOpen,
}: {
  dealId: string;
  atividades: Atividade[];
  setAtividades: (fn: (prev: Atividade[]) => Atividade[]) => void;
  usuarios: UsuarioDoc[];
  currentUser: { id: string; nome: string } | null;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { showToast } = useToast();
  const [tipo, setTipo] = useState<AtividadeTipo>("ligacao");
  const [titulo, setTitulo] = useState("");
  const [prioridade, setPrioridade] = useState<DealPrioridade>("media");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  const pendentes = useMemo(() => atividades.filter((a) => !a.concluida), [atividades]);
  const concluidas = useMemo(() => atividades.filter((a) => a.concluida), [atividades]);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !data || !horaInicio || !horaFim) return;
    const resp = usuarios.find((u) => u.email === responsavelId);
    setSalvando(true);
    try {
      const nova = await addAtividade(dealId, {
        tipo,
        titulo: titulo.trim(),
        prioridade,
        data,
        horaInicio,
        horaFim,
        responsavelId: responsavelId || currentUser?.id || "",
        responsavelNome: resp?.nome ?? currentUser?.nome ?? "—",
        observacoes: observacoes.trim() || undefined,
      });
      setAtividades((prev) => [...prev, nova]);
      setTitulo("");
      setData("");
      setHoraInicio("");
      setHoraFim("");
      setObservacoes("");
      setOpen(false);
      showToast("Atividade criada");
    } catch (err) {
      console.error(err);
      showToast("Não foi possível criar a atividade", "info");
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggle(a: Atividade) {
    setAtividades((prev) => prev.map((x) => (x.id === a.id ? { ...x, concluida: !x.concluida } : x)));
    try {
      await marcarAtividadeConcluida(dealId, a.id, !a.concluida);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-3xl">
      {!open ? (
        pendentes.length === 0 && concluidas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-[13px] text-text-faint mb-4">
            Nenhuma atividade agendada para este negócio.
          </div>
        ) : null
      ) : (
        <form onSubmit={handleSalvar} className="rounded-xl border border-border bg-card-bg p-4 mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-gray mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as AtividadeTipo)}
                className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
              >
                {(Object.keys(ATIVIDADE_TIPO_LABEL) as AtividadeTipo[]).map((t) => (
                  <option key={t} value={t}>
                    {ATIVIDADE_TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-gray mb-1">Prioridade</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as DealPrioridade)}
                className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-gray mb-1">Nome da atividade</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              placeholder="Ex.: Ligar para confirmar visita técnica"
              className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-gray mb-1">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-gray mb-1">Início</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-gray mb-1">Fim</label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-gray mb-1">Responsável</label>
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
            >
              <option value="">{currentUser?.nome ?? "Eu"}</option>
              {usuarios.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-gray mb-1">Anotações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-gray hover:bg-panel-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors mb-5"
        >
          <Plus size={15} />
          Nova atividade
        </button>
      )}

      {(pendentes.length > 0 || concluidas.length > 0) && (
        <div className="space-y-5">
          {pendentes.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-2">Pendentes</p>
              <div className="space-y-2">
                {pendentes.map((a) => (
                  <AtividadeRow key={a.id} atividade={a} onToggle={() => handleToggle(a)} />
                ))}
              </div>
            </div>
          )}
          {concluidas.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-2">Concluídas</p>
              <div className="space-y-2">
                {concluidas.map((a) => (
                  <AtividadeRow key={a.id} atividade={a} onToggle={() => handleToggle(a)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AtividadeRow({ atividade, onToggle }: { atividade: Atividade; onToggle: () => void }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-border-soft p-3 ${
        atividade.concluida ? "bg-panel-bg/50 opacity-70" : "bg-card-bg"
      }`}
    >
      <button
        onClick={onToggle}
        className={`h-5 w-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
          atividade.concluida ? "bg-brand border-brand" : "border-border"
        }`}
      >
        {atividade.concluida && <Check size={12} className="text-text-dark" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-medium text-text-dark ${atividade.concluida ? "line-through" : ""}`}>
          {ATIVIDADE_TIPO_LABEL[atividade.tipo]} · {atividade.titulo}
        </p>
        <p className="text-[11.5px] text-text-faint mt-0.5">
          {new Date(atividade.data + "T00:00:00").toLocaleDateString("pt-BR")} · {atividade.horaInicio}–
          {atividade.horaFim} · {atividade.responsavelNome}
        </p>
        {atividade.observacoes && <p className="text-[12px] text-text-gray mt-1">{atividade.observacoes}</p>}
      </div>
    </div>
  );
}
