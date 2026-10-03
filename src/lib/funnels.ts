import { Funnel, FunnelId, FuncaoId } from "./types";

export const FUNNELS: Funnel[] = [
  {
    id: "comercial",
    name: "Comercial",
    stages: [
      { id: "novo_cliente", label: "Novo cliente" },
      { id: "primeiro_contato", label: "Primeiro contato" },
      { id: "elaboracao_proposta", label: "Elaboração de proposta" },
      { id: "proposta_enviada", label: "Proposta enviada" },
      { id: "visita", label: "Visita" },
      { id: "negociacao", label: "Negociação" },
      { id: "aguardando_financiamento", label: "Aguardando financiamento" },
      { id: "contrato", label: "Contrato" },
    ],
  },
  {
    id: "engenharia",
    name: "Engenharia",
    stages: [
      { id: "onboard", label: "Onboard" },
      { id: "visita_tecnica", label: "Visita técnica" },
      { id: "projeto", label: "Projeto" },
      { id: "projeto_analise", label: "Projeto em análise" },
      { id: "instalacao_comissionamento", label: "Instalação/Comissionamento" },
      { id: "vistoria", label: "Vistoria" },
      { id: "ligacao", label: "Ligação" },
    ],
  },
  {
    id: "pos_acompanhamento",
    name: "Pós - Acompanhamento",
    stages: [
      { id: "on_board", label: "On board" },
      { id: "instalacao", label: "Instalação" },
      { id: "substituicao_medidor", label: "Substituição do medidor" },
      { id: "mes_1", label: "1º mês" },
      { id: "mes_2", label: "2º mês" },
      { id: "mes_3", label: "3º mês" },
      { id: "mes_4_5", label: "4º e 5º mês" },
      { id: "negociacao_comercial", label: "Negociação Comercial" },
    ],
  },
  {
    id: "pos_nps",
    name: "Pós - NPS",
    stages: [
      { id: "nps_comercial", label: "NPS Comercial" },
      { id: "nps_instalacao", label: "NPS Instalação" },
      { id: "nps_pos_venda", label: "NPS Pós-venda" },
    ],
  },
  {
    id: "pos_gestao_energetica",
    name: "Pós - Gestão Energética",
    stages: [
      { id: "ponto_contato_1", label: "1º Ponto de contato" },
      { id: "ponto_contato_2", label: "2º Ponto de contato" },
      { id: "ponto_contato_3", label: "3º Ponto de contato" },
      { id: "ponto_contato_4", label: "4º Ponto de contato" },
    ],
  },
  {
    id: "pos_ampliacao",
    name: "Pós - Ampliação e serviços adicionais",
    stages: [
      { id: "necessidade_interesse", label: "Necessidade de interesse" },
      { id: "elaboracao_proposta", label: "Elaboração de proposta" },
    ],
  },
];

export type DestinoCadeia = {
  funnelId: FunnelId;
  stageId: string;
  /** Prefixo do nome do card criado, ex.: "ENGENHARIA" → "[ENGENHARIA] Nome do cliente". */
  prefixoTitulo: string;
  /** Se informado, quem tem essa função na equipe é avisado no sino quando o card é criado. */
  notificarFuncao?: FuncaoId;
};

/**
 * Cadeia automática: ao marcar um negócio como Ganho, o sistema cria os cards seguintes.
 * - Comercial → Engenharia (Onboard), avisando quem é da Engenharia.
 * - Engenharia → Pós-Acompanhamento (On board) E Pós-NPS (NPS Comercial), ao mesmo tempo.
 * - Pós-Acompanhamento e Pós-NPS são o fim da cadeia (não disparam nada).
 * Para estender (Gestão Energética, Ampliação) ou avisar outra função, basta editar aqui.
 */
export const PROXIMOS_APOS_GANHO: Partial<Record<FunnelId, DestinoCadeia[]>> = {
  comercial: [{
      funnelId: "engenharia",
      stageId: "onboard",
      prefixoTitulo: "ENGENHARIA",
      notificarFuncao: "engenharia",
    },],
  engenharia: [
    { funnelId: "pos_acompanhamento", stageId: "on_board", prefixoTitulo: "PÓS" },
    { funnelId: "pos_nps", stageId: "nps_comercial", prefixoTitulo: "PÓS NPS" },
  ],
};

/**
 * Monta o nome do card da cadeia: troca o prefixo anterior pelo do novo funil.
 * "[ENGENHARIA] Kauê Silva" + "PÓS" → "[PÓS] Kauê Silva".
 */
export function tituloComPrefixo(titulo: string, prefixo: string): string {
  const base = titulo.replace(/^(\s*\[[^\]]*\]\s*)+/, "").trim() || titulo.trim();
  return `[${prefixo}] ${base}`;
}
