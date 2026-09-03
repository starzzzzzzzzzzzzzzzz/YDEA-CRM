"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Pencil,
  Info,
  Zap,
  SlidersHorizontal,
  FileText,
  Wallet,
  Wrench,
  Folder,
  Sparkles,
  Download,
  Eye,
  Trash2,
  Check,
  Bold,
  Italic,
  Underline,
  Link2,
  Paperclip,
} from "lucide-react";
import { DealDetail, PRIORIDADE_LABEL } from "@/lib/types";
import { FUNNELS } from "@/lib/funnels";
import AccordionSection, { Field } from "./AccordionSection";

function formatBRL(value?: number) {
  if (value === undefined) return undefined;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso?: string) {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const HOMOLOGACAO_LABEL: Record<string, string> = {
  nao_iniciada: "Não iniciada",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
};

const INSTALACAO_STATUS_LABEL: Record<string, string> = {
  nao_agendada: "Não agendada",
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const SITUACAO_FINANCEIRA_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  em_analise: "Em análise",
  nao_se_aplica: "Não se aplica",
};

export default function DealDetailView({ deal }: { deal: DealDetail }) {
  const [tab, setTab] = useState<"notas" | "atividades">("notas");
  const funnel = FUNNELS.find((f) => f.id === deal.funnelId);
  const stageIdx = funnel?.stages.findIndex((s) => s.id === deal.stageId) ?? 0;
  const docsEnviados = deal.documentos.filter((d) => d.status === "enviado").length;
  const docsPendentes = deal.documentos.length - docsEnviados;

  const prioridadeTone =
    deal.prioridade === "alta" ? "warning" : deal.prioridade === "media" ? "brand" : "neutral";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-text-faint mb-4">
        <Link href="/funil" className="hover:text-text-dark transition-colors">
          Funil
        </Link>
        <ChevronRight size={13} />
        <span>Negócio</span>
        <ChevronRight size={13} />
        <span className="text-brand font-medium">{deal.titulo}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-semibold text-xl text-text-dark">
              Negócio {deal.titulo}
            </h1>
            <button className="text-text-faint hover:text-text-dark transition-colors">
              <Pencil size={14} />
            </button>
          </div>
          <p className="text-[12.5px] text-text-faint mt-0.5">
            {deal.codigo} · {funnelName(deal)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-brand-soft text-brand text-[11px] font-bold flex items-center justify-center">
            {deal.responsavel}
          </div>
          <button className="rounded-lg bg-badge-green-bg text-badge-green-text font-semibold text-sm px-4 py-2 hover:opacity-80 transition-opacity">
            Ganho
          </button>
          <button className="rounded-lg bg-badge-red-bg text-badge-red-text font-semibold text-sm px-4 py-2 hover:opacity-80 transition-opacity">
            Perdido
          </button>
          <button className="rounded-lg bg-brand text-white font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors flex items-center gap-1.5">
            <FileText size={14} />
            Gerar proposta
          </button>
        </div>
      </div>

      {/* Stage progress bar */}
      {funnel && (
        <div className="mb-6">
          <p className="text-[12.5px] font-medium text-text-dark mb-1.5">
            {funnel.stages[stageIdx]?.label}
          </p>
          <div className="flex gap-1">
            {funnel.stages.map((s, i) => (
              <div
                key={s.id}
                title={s.label}
                className={`h-1.5 flex-1 rounded-full ${
                  i <= stageIdx ? "bg-brand" : "bg-border-soft"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        {/* Left: accordion sidebar */}
        <div className="flex flex-col gap-2.5">
          <AccordionSection icon={Info} title="Informações gerais" defaultOpen>
            <Field label="Código do negócio" value={deal.codigo} />
            <Field label="Nome do negócio" value={deal.titulo} />
            <Field label="Cliente" value={deal.cliente} />
            <Field label="Responsável" value={deal.responsavel} />
            <Field label="Funil" value={funnelName(deal)} />
            <Field label="Etapa" value={funnel?.stages[stageIdx]?.label} />
            <Field
              label="Prioridade"
              value={
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    prioridadeTone === "warning"
                      ? "bg-badge-red-bg text-badge-red-text"
                      : prioridadeTone === "brand"
                      ? "bg-brand-soft text-brand"
                      : "bg-panel-bg text-text-gray"
                  }`}
                >
                  {PRIORIDADE_LABEL[deal.prioridade]}
                </span>
              }
            />
            <Field label="Valor" value={formatBRL(deal.valor)} />
            <Field label="Probabilidade" value={`${deal.probabilidade}%`} />
            <Field label="Criado em" value={formatDate(deal.criadoEm)} />
            <Field label="Previsão de fechamento" value={formatDate(deal.previsaoFechamento)} />
          </AccordionSection>

          <AccordionSection icon={Zap} title="Unidade consumidora">
            <Field label="Distribuidora" value={deal.unidadeConsumidora.distribuidora} />
            <Field label="UC" value={deal.unidadeConsumidora.uc} />
            <Field label="Conta contrato" value={deal.unidadeConsumidora.contaContrato} />
            <Field label="Classe consumidora" value={deal.unidadeConsumidora.classeConsumidora} />
            <Field label="Grupo tarifário" value={deal.unidadeConsumidora.grupoTarifario} />
            <Field label="Modalidade tarifária" value={deal.unidadeConsumidora.modalidadeTarifaria} />
            <Field label="Tensão" value={deal.unidadeConsumidora.tensao} />
            <Field label="Demanda contratada" value={deal.unidadeConsumidora.demandaContratada} />
            <Field
              label="Consumo médio"
              value={
                deal.unidadeConsumidora.consumoMedio
                  ? `${deal.unidadeConsumidora.consumoMedio} kWh`
                  : undefined
              }
            />
            <Field label="Tipo de ligação" value={deal.unidadeConsumidora.tipoLigacao} />
          </AccordionSection>

          <AccordionSection icon={SlidersHorizontal} title="Dados técnicos">
            <Field
              label="Potência do sistema"
              value={
                deal.dadosTecnicos.potenciaSistemaKwp
                  ? `${deal.dadosTecnicos.potenciaSistemaKwp} kWp`
                  : undefined
              }
            />
            <Field label="Qtd. de módulos" value={deal.dadosTecnicos.qtdModulos} />
            <Field label="Modelo do painel" value={deal.dadosTecnicos.modeloPainel} />
            <Field label="Qtd. de inversores" value={deal.dadosTecnicos.qtdInversores} />
            <Field label="Modelo do inversor" value={deal.dadosTecnicos.modeloInversor} />
            <Field label="Estrutura" value={deal.dadosTecnicos.estrutura} />
            <Field label="Tipo de telhado" value={deal.dadosTecnicos.tipoTelhado} />
            <Field label="Inclinação" value={deal.dadosTecnicos.inclinacao} />
            <Field label="Orientação solar" value={deal.dadosTecnicos.orientacaoSolar} />
            <Field label="Área disponível" value={deal.dadosTecnicos.areaDisponivel} />
            <Field label="Sombreamento" value={deal.dadosTecnicos.sombreamento} />
          </AccordionSection>

          <AccordionSection
            icon={FileText}
            title="Projeto solar"
            badge={HOMOLOGACAO_LABEL[deal.projetoSolar.homologacao]}
            badgeTone={
              deal.projetoSolar.homologacao === "aprovada"
                ? "success"
                : deal.projetoSolar.homologacao === "reprovada"
                ? "warning"
                : "neutral"
            }
          >
            <Field label="Projeto enviado" value={deal.projetoSolar.projetoEnviado ? "Sim" : "Não"} />
            <Field label="ART" value={deal.projetoSolar.art ? "Sim" : "Não"} />
            <Field
              label="Diagrama unifilar"
              value={deal.projetoSolar.diagramaUnifilar ? "Sim" : "Não"}
            />
            <Field label="Data da aprovação" value={formatDate(deal.projetoSolar.dataAprovacao)} />
            <Field label="Número do projeto" value={deal.projetoSolar.numeroProjeto} />
            <Field label="Responsável técnico" value={deal.projetoSolar.responsavelTecnico} />
          </AccordionSection>

          <AccordionSection icon={Wallet} title="Financeiro">
            <Field label="Valor do projeto" value={formatBRL(deal.financeiro.valorProjeto)} />
            <Field
              label="Valor dos equipamentos"
              value={formatBRL(deal.financeiro.valorEquipamentos)}
            />
            <Field label="Valor da instalação" value={formatBRL(deal.financeiro.valorInstalacao)} />
            <Field label="Comissão" value={formatBRL(deal.financeiro.comissao)} />
            <Field label="Lucro" value={formatBRL(deal.financeiro.lucro)} />
            <Field label="Margem" value={deal.financeiro.margem ? `${deal.financeiro.margem}%` : undefined} />
            <Field label="Entrada" value={formatBRL(deal.financeiro.entrada)} />
            <Field label="Parcelas" value={deal.financeiro.parcelas ? `${deal.financeiro.parcelas}x` : undefined} />
            <Field label="Banco" value={deal.financeiro.banco} />
            <Field label="Taxa" value={deal.financeiro.taxa ? `${deal.financeiro.taxa}% a.m.` : undefined} />
            <Field
              label="Situação financeira"
              value={SITUACAO_FINANCEIRA_LABEL[deal.financeiro.situacao]}
            />
          </AccordionSection>

          <AccordionSection
            icon={Wrench}
            title="Instalação"
            badge={INSTALACAO_STATUS_LABEL[deal.instalacao.status]}
            badgeTone={deal.instalacao.status === "concluida" ? "success" : "neutral"}
          >
            <Field label="Equipe" value={deal.instalacao.equipe} />
            <Field label="Data agendada" value={formatDate(deal.instalacao.dataAgendada)} />
            <Field label="Data executada" value={formatDate(deal.instalacao.dataExecutada)} />
            <Field
              label="Checklist"
              value={`${deal.instalacao.checklistConcluido}/${deal.instalacao.checklistTotal}`}
            />
            <Field label="Pendências" value={deal.instalacao.pendencias} />
          </AccordionSection>

          <AccordionSection
            icon={Folder}
            title="Documentos"
            badge={`${docsEnviados}/${deal.documentos.length}`}
            badgeTone={docsPendentes > 0 ? "warning" : "success"}
          >
            <div className="grid grid-cols-1 gap-2 pt-1">
              {deal.documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border-soft px-2.5 py-2"
                >
                  <FileText size={15} className="text-text-faint shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-text-dark truncate">
                      {doc.nome}
                    </p>
                    <p className="text-[11px] text-text-faint">
                      {doc.status === "enviado"
                        ? `Enviado por ${doc.enviadoPor} em ${formatDate(doc.enviadoEm)}`
                        : "Pendente de envio"}
                    </p>
                  </div>
                  {doc.status === "enviado" ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="h-7 w-7 rounded-md flex items-center justify-center text-text-faint hover:text-text-dark hover:bg-panel-bg transition-colors">
                        <Eye size={13} />
                      </button>
                      <button className="h-7 w-7 rounded-md flex items-center justify-center text-text-faint hover:text-text-dark hover:bg-panel-bg transition-colors">
                        <Download size={13} />
                      </button>
                      <button className="h-7 w-7 rounded-md flex items-center justify-center text-text-faint hover:text-badge-red-text hover:bg-panel-bg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-badge-red-bg text-badge-red-text shrink-0">
                      Pendente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection
            icon={Sparkles}
            title="IA"
            badge={`${deal.ia.chanceFechar}% chance`}
            badgeTone="brand"
            defaultOpen
          >
            <div className="pt-1 space-y-2">
              <p className="text-[12.5px] text-text-dark leading-relaxed">
                Cliente possui <strong>{deal.ia.chanceFechar}%</strong> de chance de fechar. Última
                interação há {deal.ia.ultimaInteracaoDias} dia(s). {deal.ia.recomendacao}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg bg-panel-bg px-3 py-2">
                  <p className="text-[11px] text-text-faint">Economia anual estimada</p>
                  <p className="text-[13px] font-semibold text-text-dark">
                    {formatBRL(deal.ia.economiaAnualEstimada)}
                  </p>
                </div>
                <div className="rounded-lg bg-panel-bg px-3 py-2">
                  <p className="text-[11px] text-text-faint">Tempo estimado de retorno</p>
                  <p className="text-[13px] font-semibold text-text-dark">
                    {deal.ia.paybackAnos} anos
                  </p>
                </div>
              </div>
            </div>
          </AccordionSection>
        </div>

        {/* Right: notes / activity / timeline */}
        <div className="min-w-0">
          <div className="flex items-center gap-5 border-b border-border mb-4">
            <button
              onClick={() => setTab("notas")}
              className={`text-[13px] font-medium pb-2.5 border-b-2 transition-colors ${
                tab === "notas"
                  ? "border-brand text-brand"
                  : "border-transparent text-text-faint hover:text-text-dark"
              }`}
            >
              Anotações
            </button>
            <button
              onClick={() => setTab("atividades")}
              className={`text-[13px] font-medium pb-2.5 border-b-2 transition-colors ${
                tab === "atividades"
                  ? "border-brand text-brand"
                  : "border-transparent text-text-faint hover:text-text-dark"
              }`}
            >
              Atividades
            </button>
          </div>

          {tab === "notas" && (
            <div className="border border-border rounded-lg bg-card-bg p-3 mb-5">
              <textarea
                rows={3}
                placeholder="Escreva uma anotação sobre este negócio..."
                className="w-full resize-none text-sm text-text-dark placeholder:text-text-faint outline-none"
              />
              <div className="flex items-center justify-between pt-2 border-t border-border-soft">
                <div className="flex items-center gap-1 text-text-faint">
                  <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-panel-bg hover:text-text-dark transition-colors">
                    <Bold size={14} />
                  </button>
                  <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-panel-bg hover:text-text-dark transition-colors">
                    <Italic size={14} />
                  </button>
                  <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-panel-bg hover:text-text-dark transition-colors">
                    <Underline size={14} />
                  </button>
                  <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-panel-bg hover:text-text-dark transition-colors">
                    <Link2 size={14} />
                  </button>
                  <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-panel-bg hover:text-text-dark transition-colors">
                    <Paperclip size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg border border-border px-3.5 py-1.5 text-[13px] text-text-gray hover:text-text-dark transition-colors">
                    Cancelar
                  </button>
                  <button className="rounded-lg bg-brand text-white font-semibold text-[13px] px-3.5 py-1.5 hover:bg-brand-strong transition-colors">
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-[13px] font-semibold text-text-dark mb-3">Linha do tempo</p>
          <div className="flex flex-col gap-4">
            {deal.timeline.map((ev) => (
              <div key={ev.id} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-panel-bg flex items-center justify-center shrink-0 mt-0.5">
                  {ev.tipo === "nota" ? (
                    <FileText size={13} className="text-text-gray" />
                  ) : ev.tipo === "atividade" ? (
                    <Check size={13} className="text-text-gray" />
                  ) : (
                    <Info size={13} className="text-text-gray" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-text-dark">
                    <span className="font-medium">{ev.autor}</span> · {ev.titulo}
                  </p>
                  {ev.descricao && (
                    <p className="text-[12.5px] text-text-gray mt-0.5">{ev.descricao}</p>
                  )}
                  <p className="text-[11px] text-text-faint mt-0.5">{formatDate(ev.data)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function funnelName(deal: DealDetail) {
  return FUNNELS.find((f) => f.id === deal.funnelId)?.name ?? deal.funnelId;
}
