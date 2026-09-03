"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  X,
  Loader2,
  Check,
  Zap,
  Gauge,
  FileStack,
  NotebookPen,
  Building2,
  User2,
  Save,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Field, inputClass, inputErrorClass } from "@/components/ui/Field";
import SearchSelect, { SearchSelectItem } from "@/components/ui/SearchSelect";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useToast } from "@/components/ui/Toast";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { hasPermission } from "@/lib/db/permissoes";
import DocumentUploadGrid from "./DocumentUploadGrid";
import OrganizacaoModal from "./OrganizacaoModal";
import PessoaModal from "./PessoaModal";
import {
  Deal,
  DealPrioridade,
  DealStatus,
  DocumentoAnexo,
  Funnel,
  FunnelId,
  Organizacao,
  Pessoa,
  Temperatura,
  TEMPERATURA_LABEL,
} from "@/lib/types";
import { FUNNELS } from "@/lib/funnels";
import { TEAM_MEMBERS, CANAIS_ORIGEM } from "@/lib/mock-team";
import { maskCurrencyDigits, currencyDigitsToNumber } from "@/lib/masks";

type FormState = {
  titulo: string;
  responsavel: string;
  funnelId: FunnelId;
  stageId: string;
  valorDigits: string;
  previsaoFechamento: string;
  canalOrigem: string;
  prioridade: DealPrioridade;
  probabilidade: number;
  temperatura: Temperatura;
  status: DealStatus;

  distribuidora: string;
  contaContrato: string;
  numeroUC: string;
  classeConsumidora: string;
  grupoTarifario: string;
  modalidadeTarifaria: string;
  fase: string;
  tensao: string;
  consumoMedio: string;
  cargaInstalada: string;
  demandaContratada: string;

  potenciaSistema: string;
  valorProjetoDigits: string;
  tipoTelhado: string;
  estrutura: string;
  inclinacao: string;
  orientacao: string;
  area: string;
  drone: boolean;
  trocaTitularidade: boolean;
  validadeProposta: string;

  observacoes: string;
};

function emptyForm(funnel: Funnel): FormState {
  return {
    titulo: "",
    responsavel: "",
    funnelId: funnel.id,
    stageId: funnel.stages[0].id,
    valorDigits: "",
    previsaoFechamento: "",
    canalOrigem: "",
    prioridade: "media",
    probabilidade: 50,
    temperatura: "morno",
    status: "aberto",

    distribuidora: "",
    contaContrato: "",
    numeroUC: "",
    classeConsumidora: "",
    grupoTarifario: "",
    modalidadeTarifaria: "",
    fase: "",
    tensao: "",
    consumoMedio: "",
    cargaInstalada: "",
    demandaContratada: "",

    potenciaSistema: "",
    valorProjetoDigits: "",
    tipoTelhado: "",
    estrutura: "",
    inclinacao: "",
    orientacao: "",
    area: "",
    drone: false,
    trocaTitularidade: false,
    validadeProposta: "",

    observacoes: "",
  };
}

function CardSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card-bg p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-8 w-8 rounded-lg bg-brand-soft text-brand-strong flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-display font-semibold text-[14.5px] text-text-dark">{title}</h3>
          {subtitle && <p className="text-[12px] text-text-faint mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function draftKey(funnelId: string) {
  return `ydea:deal-draft:${funnelId}`;
}

export default function NewDealModal({
  funnel,
  onClose,
  onCreate,
}: {
  funnel: Funnel;
  onClose: () => void;
  onCreate: (deal: Omit<Deal, "id" | "createdAt">) => void;
}) {
  const { showToast } = useToast();
  const { organizacoes, pessoas, addOrganizacao, addPessoa, currentUser } = useCrmData();

  function loadDraft(): { form?: Partial<FormState>; organizacaoId?: string; pessoaId?: string } | null {
    try {
      const raw = localStorage.getItem(draftKey(funnel.id));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  const [draft] = useState(loadDraft);

  const [organizacao, setOrganizacao] = useState<Organizacao | null>(
    () => (draft?.organizacaoId && organizacoes.find((o) => o.id === draft.organizacaoId)) || null
  );
  const [pessoa, setPessoa] = useState<Pessoa | null>(
    () => (draft?.pessoaId && pessoas.find((p) => p.id === draft.pessoaId)) || null
  );
  const [documentos, setDocumentos] = useState<DocumentoAnexo[]>([]);
  const [form, setForm] = useState<FormState>(() => ({ ...emptyForm(funnel), ...draft?.form }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<"draft" | "create" | "proposal" | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [subModal, setSubModal] = useState<
    { type: "organizacao"; query: string } | { type: "pessoa"; query: string } | null
  >(null);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftNoticeShown = useRef(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  // --- Notify about a restored draft (state was already loaded synchronously above) ---
  useEffect(() => {
    if (draft && !draftNoticeShown.current) {
      draftNoticeShown.current = true;
      showToast("Rascunho anterior carregado", "info");
    }
  }, [draft, showToast]);

  function persistDraft() {
    const payload = { form, organizacaoId: organizacao?.id, pessoaId: pessoa?.id };
    localStorage.setItem(draftKey(funnel.id), JSON.stringify(payload));
    setLastSavedAt(new Date());
  }

  // --- Autosave every 4s while there's meaningful content ---
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (!form.titulo.trim() && !organizacao && !pessoa) return;
    autosaveTimer.current = setTimeout(persistDraft, 4000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, organizacao, pessoa]);

  // --- Keyboard shortcut: Ctrl/Cmd + S ---
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleCreate();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const orgItems: SearchSelectItem[] = useMemo(
    () =>
      organizacoes.map((o) => ({
        id: o.id,
        label: o.nome,
        sublabel: o.cnpj || o.cpf || o.cidade,
        meta: `${o.cnpj ?? ""} ${o.cpf ?? ""} ${o.telefone ?? ""}`,
      })),
    [organizacoes]
  );

  const pessoaItems: SearchSelectItem[] = useMemo(() => {
    const list = organizacao ? pessoas.filter((p) => p.organizacaoId === organizacao.id) : pessoas;
    const rest = organizacao ? pessoas.filter((p) => p.organizacaoId !== organizacao.id) : [];
    return [...list, ...rest].map((p) => ({
      id: p.id,
      label: p.nome,
      sublabel: p.cargo || p.email || p.telefone,
      meta: `${p.cpf ?? ""} ${p.telefone ?? ""} ${p.email ?? ""}`,
    }));
  }, [pessoas, organizacao]);

  const responsavelItems: SearchSelectItem[] = TEAM_MEMBERS.map((m) => ({ id: m.id, label: m.nome }));
  const canalItems: SearchSelectItem[] = CANAIS_ORIGEM.map((c) => ({ id: c, label: c }));
  const funnelItems: SearchSelectItem[] = FUNNELS.filter((f) =>
    hasPermission(currentUser.cargoId, `funil.${f.id}`)
  ).map((f) => ({ id: f.id, label: f.name }));
  const selectedFunnel = FUNNELS.find((f) => f.id === form.funnelId) ?? funnel;
  const stageItems: SearchSelectItem[] = selectedFunnel.stages.map((s) => ({ id: s.id, label: s.label }));

  function handleFunnelChange(newFunnelId: FunnelId) {
    const nf = FUNNELS.find((f) => f.id === newFunnelId);
    if (!nf) return;
    setForm((prev) => ({ ...prev, funnelId: newFunnelId, stageId: nf.stages[0].id }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.titulo.trim()) next.titulo = "Informe o título do negócio.";
    if (!form.responsavel.trim()) next.responsavel = "Selecione um responsável.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildDeal(): Omit<Deal, "id" | "createdAt"> {
    return {
      titulo: form.titulo.trim(),
      valor: currencyDigitsToNumber(form.valorDigits),
      responsavel:
        TEAM_MEMBERS.find((m) => m.id === form.responsavel)?.iniciais ||
        form.responsavel.slice(0, 2).toUpperCase(),
      funnelId: form.funnelId,
      stageId: form.stageId,

      organizacaoId: organizacao?.id,
      pessoaId: pessoa?.id,

      previsaoFechamento: form.previsaoFechamento || undefined,
      canalOrigem: form.canalOrigem || undefined,
      prioridade: form.prioridade,
      probabilidade: form.probabilidade,
      temperatura: form.temperatura,
      status: form.status,

      distribuidora: form.distribuidora || undefined,
      contaContrato: form.contaContrato || undefined,
      numeroUC: form.numeroUC || undefined,
      classeConsumidora: form.classeConsumidora || undefined,
      grupoTarifario: form.grupoTarifario || undefined,
      modalidadeTarifaria: form.modalidadeTarifaria || undefined,
      fase: form.fase || undefined,
      tensao: form.tensao || undefined,
      consumoMedio: form.consumoMedio ? Number(form.consumoMedio) : undefined,
      cargaInstalada: form.cargaInstalada ? Number(form.cargaInstalada) : undefined,
      demandaContratada: form.demandaContratada ? Number(form.demandaContratada) : undefined,

      potenciaSistema: form.potenciaSistema ? Number(form.potenciaSistema) : undefined,
      valorProjeto: form.valorProjetoDigits ? currencyDigitsToNumber(form.valorProjetoDigits) : undefined,
      tipoTelhado: form.tipoTelhado || undefined,
      estrutura: form.estrutura || undefined,
      inclinacao: form.inclinacao ? Number(form.inclinacao) : undefined,
      orientacao: form.orientacao || undefined,
      area: form.area ? Number(form.area) : undefined,
      drone: form.drone,
      trocaTitularidade: form.trocaTitularidade,
      validadeProposta: form.validadeProposta || undefined,

      documentos: documentos.length ? documentos : undefined,
      observacoes: form.observacoes || undefined,
    };
  }

  function handleSaveDraft() {
    setSubmitting("draft");
    setTimeout(() => {
      persistDraft();
      setSubmitting(null);
      showToast("Rascunho salvo com sucesso");
      onClose();
    }, 400);
  }

  function handleCreate(generateProposal = false) {
    if (!validate()) {
      showToast("Revise os campos obrigatórios destacados", "error");
      return;
    }
    setSubmitting(generateProposal ? "proposal" : "create");
    setTimeout(() => {
      localStorage.removeItem(draftKey(funnel.id));
      onCreate(buildDeal());
      setSubmitting(null);
      showToast(
        generateProposal ? "Negócio criado — gerando proposta..." : "Negócio criado com sucesso"
      );
    }, 600);
  }

  return (
    <>
      <Modal onClose={onClose} widthClass="max-w-4xl" closeOnBackdrop={false} labelledBy="deal-modal-title">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-sm font-medium text-text-gray hover:text-text-dark transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
              Negócios
            </button>
            <span className="text-border">/</span>
            <h2 id="deal-modal-title" className="font-display font-semibold text-[15px] text-text-dark truncate">
              Novo Negócio <span className="text-text-faint font-normal">· {selectedFunnel.name}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {lastSavedAt && (
              <span className="hidden sm:flex items-center gap-1 text-[11.5px] text-text-faint">
                <Save size={12} />
                Salvo às {lastSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button onClick={onClose} className="text-text-faint hover:text-text-gray" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-5 bg-panel-bg/40">
          {/* Organização */}
          <CardSection icon={<Building2 size={16} />} title="Organização">
            <SearchSelect
              items={orgItems}
              value={organizacao ? { id: organizacao.id, label: organizacao.nome, sublabel: organizacao.cnpj } : null}
              onChange={(item) => {
                if (!item) {
                  setOrganizacao(null);
                  return;
                }
                const org = organizacoes.find((o) => o.id === item.id) ?? null;
                setOrganizacao(org);
                if (pessoa && pessoa.organizacaoId !== org?.id) setPessoa(null);
              }}
              placeholder="Pesquisar por nome, razão social, CNPJ ou telefone"
              emptyHint="Nenhuma organização encontrada"
              createLabel={(q) => (q ? `Criar "${q}"` : "Nova organização")}
              onCreate={(q) => setSubModal({ type: "organizacao", query: q })}
              size="lg"
            />
          </CardSection>

          {/* Pessoa */}
          <CardSection icon={<User2 size={16} />} title="Pessoa">
            <SearchSelect
              items={pessoaItems}
              value={pessoa ? { id: pessoa.id, label: pessoa.nome, sublabel: pessoa.cargo } : null}
              onChange={(item) => {
                if (!item) {
                  setPessoa(null);
                  return;
                }
                setPessoa(pessoas.find((p) => p.id === item.id) ?? null);
              }}
              placeholder="Pesquisar por nome, CPF, telefone ou email"
              emptyHint="Nenhuma pessoa encontrada"
              createLabel={(q) => (q ? `Criar "${q}"` : "Nova pessoa")}
              onCreate={(q) => setSubModal({ type: "pessoa", query: q })}
              size="lg"
            />
          </CardSection>

          {/* Dados do Negócio */}
          <CardSection icon={<Gauge size={16} />} title="Dados do Negócio">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Título" required error={errors.titulo} className="sm:col-span-2">
                <input
                  className={`${inputClass} ${errors.titulo ? inputErrorClass : ""}`}
                  value={form.titulo}
                  onChange={(e) => set("titulo", e.target.value)}
                  placeholder="Ex: Instalação residencial — João Silva"
                />
              </Field>

              <Field label="Responsável" required error={errors.responsavel}>
                <SearchSelect
                  items={responsavelItems}
                  value={
                    form.responsavel
                      ? responsavelItems.find((i) => i.id === form.responsavel) ?? {
                          id: form.responsavel,
                          label: form.responsavel,
                        }
                      : null
                  }
                  onChange={(item) => set("responsavel", item?.id ?? "")}
                  placeholder="Selecionar responsável"
                />
              </Field>

              <Field label="Funil">
                <SearchSelect
                  items={funnelItems}
                  value={funnelItems.find((i) => i.id === form.funnelId) ?? null}
                  onChange={(item) => item && handleFunnelChange(item.id as FunnelId)}
                  placeholder="Selecionar funil"
                />
              </Field>

              <Field label="Etapa">
                <SearchSelect
                  items={stageItems}
                  value={stageItems.find((i) => i.id === form.stageId) ?? null}
                  onChange={(item) => item && set("stageId", item.id)}
                  placeholder="Selecionar etapa"
                />
              </Field>

              <Field label="Valor (R$)">
                <input
                  inputMode="numeric"
                  className={inputClass}
                  value={form.valorDigits ? maskCurrencyDigits(form.valorDigits) : ""}
                  onChange={(e) => set("valorDigits", e.target.value)}
                  placeholder="0,00"
                />
              </Field>

              <Field label="Previsão de fechamento">
                <input
                  type="date"
                  className={inputClass}
                  value={form.previsaoFechamento}
                  onChange={(e) => set("previsaoFechamento", e.target.value)}
                />
              </Field>

              <Field label="Canal de origem" className="sm:col-span-2">
                <SearchSelect
                  items={canalItems}
                  value={form.canalOrigem ? { id: form.canalOrigem, label: form.canalOrigem } : null}
                  onChange={(item) => set("canalOrigem", item?.id ?? "")}
                  placeholder="Selecionar canal"
                />
              </Field>

              <Field label="Prioridade">
                <div className="flex gap-2">
                  {(["baixa", "media", "alta"] as DealPrioridade[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set("prioridade", p)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        form.prioridade === p
                          ? "border-brand bg-brand-soft text-brand-strong"
                          : "border-border text-text-gray hover:bg-panel-bg"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={`Probabilidade — ${form.probabilidade}%`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.probabilidade}
                  onChange={(e) => set("probabilidade", Number(e.target.value))}
                  className="w-full accent-brand h-9"
                />
              </Field>

              <Field label="Temperatura">
                <div className="flex gap-2">
                  {(["frio", "morno", "quente"] as Temperatura[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("temperatura", t)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        form.temperatura === t
                          ? "border-brand bg-brand-soft text-brand-strong"
                          : "border-border text-text-gray hover:bg-panel-bg"
                      }`}
                    >
                      {TEMPERATURA_LABEL[t]}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Status">
                <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value as DealStatus)}>
                  <option value="aberto">Aberto</option>
                  <option value="ganho">Ganho</option>
                  <option value="perdido">Perdido</option>
                </select>
              </Field>
            </div>
          </CardSection>

          {/* Unidade Consumidora */}
          <CardSection icon={<Zap size={16} />} title="Unidade Consumidora">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Distribuidora">
                <input className={inputClass} value={form.distribuidora} onChange={(e) => set("distribuidora", e.target.value)} placeholder="Cosern" />
              </Field>
              <Field label="Conta contrato">
                <input className={inputClass} value={form.contaContrato} onChange={(e) => set("contaContrato", e.target.value)} />
              </Field>
              <Field label="Número UC">
                <input className={inputClass} value={form.numeroUC} onChange={(e) => set("numeroUC", e.target.value)} />
              </Field>
              <Field label="Classe consumidora">
                <input className={inputClass} value={form.classeConsumidora} onChange={(e) => set("classeConsumidora", e.target.value)} placeholder="Residencial, Rural..." />
              </Field>
              <Field label="Grupo tarifário">
                <input className={inputClass} value={form.grupoTarifario} onChange={(e) => set("grupoTarifario", e.target.value)} placeholder="B1, A4..." />
              </Field>
              <Field label="Modalidade tarifária">
                <input className={inputClass} value={form.modalidadeTarifaria} onChange={(e) => set("modalidadeTarifaria", e.target.value)} />
              </Field>
              <Field label="Fase">
                <select className={inputClass} value={form.fase} onChange={(e) => set("fase", e.target.value)}>
                  <option value="">Selecionar</option>
                  <option value="mono">Monofásica</option>
                  <option value="bi">Bifásica</option>
                  <option value="tri">Trifásica</option>
                </select>
              </Field>
              <Field label="Tensão">
                <input className={inputClass} value={form.tensao} onChange={(e) => set("tensao", e.target.value)} placeholder="127V, 220V..." />
              </Field>
              <Field label="Consumo médio (kWh/mês)">
                <input type="number" className={inputClass} value={form.consumoMedio} onChange={(e) => set("consumoMedio", e.target.value)} />
              </Field>
              <Field label="Carga instalada (kW)">
                <input type="number" className={inputClass} value={form.cargaInstalada} onChange={(e) => set("cargaInstalada", e.target.value)} />
              </Field>
              <Field label="Demanda contratada (kW)">
                <input type="number" className={inputClass} value={form.demandaContratada} onChange={(e) => set("demandaContratada", e.target.value)} />
              </Field>
            </div>
          </CardSection>

          {/* Projeto Solar */}
          <CardSection icon={<Zap size={16} />} title="Projeto Solar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Potência do sistema (kWp)">
                <input type="number" className={inputClass} value={form.potenciaSistema} onChange={(e) => set("potenciaSistema", e.target.value)} />
              </Field>
              <Field label="Valor do projeto (R$)">
                <input
                  inputMode="numeric"
                  className={inputClass}
                  value={form.valorProjetoDigits ? maskCurrencyDigits(form.valorProjetoDigits) : ""}
                  onChange={(e) => set("valorProjetoDigits", e.target.value)}
                  placeholder="0,00"
                />
              </Field>
              <Field label="Tipo de telhado">
                <input className={inputClass} value={form.tipoTelhado} onChange={(e) => set("tipoTelhado", e.target.value)} placeholder="Cerâmico, metálico, laje..." />
              </Field>
              <Field label="Estrutura">
                <input className={inputClass} value={form.estrutura} onChange={(e) => set("estrutura", e.target.value)} />
              </Field>
              <Field label="Inclinação (°)">
                <input type="number" className={inputClass} value={form.inclinacao} onChange={(e) => set("inclinacao", e.target.value)} />
              </Field>
              <Field label="Orientação">
                <input className={inputClass} value={form.orientacao} onChange={(e) => set("orientacao", e.target.value)} placeholder="Norte, Sul..." />
              </Field>
              <Field label="Área (m²)">
                <input type="number" className={inputClass} value={form.area} onChange={(e) => set("area", e.target.value)} />
              </Field>
              <Field label="Validade da proposta">
                <input type="date" className={inputClass} value={form.validadeProposta} onChange={(e) => set("validadeProposta", e.target.value)} />
              </Field>
              <div className="flex flex-col justify-center gap-2.5 pt-1">
                <label className="flex items-center gap-2 text-sm text-text-dark cursor-pointer">
                  <input type="checkbox" className="accent-brand h-4 w-4" checked={form.drone} onChange={(e) => set("drone", e.target.checked)} />
                  Levantamento com drone
                </label>
                <label className="flex items-center gap-2 text-sm text-text-dark cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-brand h-4 w-4"
                    checked={form.trocaTitularidade}
                    onChange={(e) => set("trocaTitularidade", e.target.checked)}
                  />
                  Troca de titularidade
                </label>
              </div>
            </div>
          </CardSection>

          {/* Documentos */}
          <CardSection icon={<FileStack size={16} />} title="Documentos" subtitle="Arraste os arquivos ou clique para enviar">
            <DocumentUploadGrid documentos={documentos} onChange={setDocumentos} />
          </CardSection>

          {/* Observações */}
          <CardSection icon={<NotebookPen size={16} />} title="Observações">
            <RichTextEditor value={form.observacoes} onChange={(v) => set("observacoes", v)} />
          </CardSection>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 px-5 sm:px-6 py-4 border-t border-border-soft shrink-0 bg-card-bg">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-text-gray hover:bg-panel-bg transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={submitting !== null}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-gray hover:bg-panel-bg transition-colors disabled:opacity-70"
          >
            {submitting === "draft" && <Loader2 size={14} className="animate-spin-slow" />}
            Salvar Rascunho
          </button>
          <button
            type="button"
            onClick={() => handleCreate(false)}
            disabled={submitting !== null}
            className="flex items-center gap-2 rounded-lg bg-brand text-text-dark font-semibold text-sm px-5 py-2.5 hover:bg-brand-strong transition-colors disabled:opacity-70"
          >
            {submitting === "create" ? <Loader2 size={15} className="animate-spin-slow" /> : <Check size={15} />}
            Criar Negócio
          </button>
          <button
            type="button"
            onClick={() => handleCreate(true)}
            disabled={submitting !== null}
            className="flex items-center gap-2 rounded-lg bg-brand-strong text-text-dark font-semibold text-sm px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-70"
          >
            {submitting === "proposal" && <Loader2 size={15} className="animate-spin-slow" />}
            Criar + Gerar Proposta
          </button>
        </div>
      </Modal>

      {subModal?.type === "organizacao" && (
        <OrganizacaoModal
          initialNome={subModal.query}
          onClose={() => setSubModal(null)}
          onCreated={(org) => {
            addOrganizacao(org);
            setOrganizacao(org);
            setSubModal(null);
          }}
        />
      )}

      {subModal?.type === "pessoa" && (
        <PessoaModal
          initialNome={subModal.query}
          organizacao={organizacao}
          onClose={() => setSubModal(null)}
          onCreated={(p) => {
            addPessoa(p);
            setPessoa(p);
            setSubModal(null);
          }}
        />
      )}
    </>
  );
}
