import { Deal, DealDetail, DealDocumento, TimelineEvento } from "./types";
import { FUNNELS } from "./funnels";

// Hash simples e determinístico a partir do id do negócio, usado para variar
// os dados mockados sem precisar escrever tudo à mão para cada negócio.
function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

const DISTRIBUIDORAS = ["Neoenergia COSERN", "Energisa PB", "Neoenergia PE", "CHESF"];
const MODELOS_PAINEL = ["Canadian Solar 550W", "Jinko Tiger Neo 555W", "Trina Vertex 545W"];
const MODELOS_INVERSOR = ["Growatt MIN 5000TL-X", "Fronius Primo 6.0", "Deye SUN-8K"];
const ESTRUTURAS = ["Telhado cerâmico", "Telhado metálico", "Solo", "Fibrocimento"];

const DOC_TIPOS: { tipo: string; nome: string }[] = [
  { tipo: "conta_energia", nome: "Conta de energia" },
  { tipo: "rg", nome: "RG" },
  { tipo: "cpf", nome: "CPF" },
  { tipo: "cnh", nome: "CNH" },
  { tipo: "comprovante", nome: "Comprovante de endereço" },
  { tipo: "contrato", nome: "Contrato" },
  { tipo: "projeto", nome: "Projeto" },
  { tipo: "art", nome: "ART" },
  { tipo: "fotos", nome: "Fotos técnicas" },
  { tipo: "drone", nome: "Drone" },
  { tipo: "kit_fotovoltaico", nome: "Kit fotovoltaico" },
];

function stageLabel(funnelId: string, stageId: string): string {
  const funnel = FUNNELS.find((f) => f.id === funnelId);
  return funnel?.stages.find((s) => s.id === stageId)?.label ?? stageId;
}

function funnelName(funnelId: string): string {
  return FUNNELS.find((f) => f.id === funnelId)?.name ?? funnelId;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysAhead(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Gera o detalhe completo de um negócio a partir dos dados básicos do Kanban. */
export function buildDealDetail(deal: Deal): DealDetail {
  const seed = hash(deal.id);
  const potencia = Math.max(2, Math.round(((deal.valor || 15000) / 4500) * 10) / 10);
  const consumoMedio = Math.round(potencia * 130 + (seed % 50));
  const idade = 3 + (seed % 40);
  const prioridade = pick(["baixa", "media", "alta"] as const, seed);
  const homologacaoOpts = ["nao_iniciada", "em_analise", "aprovada", "reprovada"] as const;
  const homologacao = pick(homologacaoOpts, seed >> 2);
  const instalacaoStatusOpts = ["nao_agendada", "agendada", "em_andamento", "concluida"] as const;
  const instalacaoStatus = pick(instalacaoStatusOpts, seed >> 3);
  const checklistTotal = 8;
  const checklistConcluido =
    instalacaoStatus === "concluida"
      ? checklistTotal
      : instalacaoStatus === "em_andamento"
      ? 4 + (seed % 3)
      : instalacaoStatus === "agendada"
      ? 1
      : 0;

  const docsEnviados = 3 + (seed % (DOC_TIPOS.length - 3));
  const documentos: DealDocumento[] = DOC_TIPOS.map((d, i) => {
    const enviado = i < docsEnviados;
    return {
      id: `${deal.id}-doc-${d.tipo}`,
      nome: d.nome,
      tipo: d.tipo,
      status: enviado ? "enviado" : "pendente",
      enviadoEm: enviado ? daysAgo(idade - i) : undefined,
      enviadoPor: enviado ? deal.responsavel : undefined,
    };
  });

  const valorProjeto = deal.valor || 15000;
  const valorEquipamentos = Math.round(valorProjeto * 0.62);
  const valorInstalacao = Math.round(valorProjeto * 0.18);
  const comissao = Math.round(valorProjeto * 0.06);
  const lucro = Math.round(valorProjeto - valorEquipamentos - valorInstalacao - comissao);
  const margem = valorProjeto > 0 ? Math.round((lucro / valorProjeto) * 1000) / 10 : 0;

  const timeline: TimelineEvento[] = [
    {
      id: `${deal.id}-t1`,
      tipo: "alteracao",
      titulo: "Registro de negócio criado",
      autor: deal.responsavel,
      data: daysAgo(idade),
    },
    {
      id: `${deal.id}-t2`,
      tipo: "atividade",
      titulo: "Visita técnica agendada",
      autor: deal.responsavel,
      data: daysAgo(Math.max(1, idade - 3)),
    },
    {
      id: `${deal.id}-t3`,
      tipo: "nota",
      titulo: "Cliente confirmou interesse por WhatsApp",
      descricao: "Aguardando envio do último comprovante para fechar.",
      autor: deal.responsavel,
      data: daysAgo(Math.max(0, idade - idade + 4 > idade ? 1 : 4)),
    },
  ];

  return {
    ...deal,
    codigo: `SL-${2026}-${(1000 + seed % 9000).toString().padStart(4, "0")}`,
    cliente: deal.titulo,
    status: "aberto",
    prioridade,
    probabilidade: 30 + (seed % 65),
    criadoEm: daysAgo(idade),
    previsaoFechamento: daysAhead(5 + (seed % 25)),

    unidadeConsumidora: {
      distribuidora: pick(DISTRIBUIDORAS, seed),
      uc: `${100000 + (seed % 899999)}`,
      contaContrato: `${seed % 9999999}`,
      classeConsumidora: pick(["Residencial", "Comercial", "Rural"], seed >> 1),
      grupoTarifario: pick(["B1", "B3", "A4"], seed >> 2),
      subgrupo: "-",
      modalidadeTarifaria: pick(["Convencional", "Branca"], seed >> 3),
      tensao: pick(["127/220V", "220/380V", "13.8kV"], seed >> 4),
      demandaContratada: pick(["-", "30 kW", "50 kW"], seed >> 5),
      consumoMedio,
      consumo12Meses: Array.from({ length: 12 }, (_, i) =>
        Math.max(50, Math.round(consumoMedio * (0.85 + ((seed + i * 7) % 30) / 100)))
      ),
      tipoLigacao: pick(["Monofásica", "Bifásica", "Trifásica"], seed >> 6),
    },

    dadosTecnicos: {
      potenciaSistemaKwp: potencia,
      qtdModulos: Math.max(4, Math.round((potencia * 1000) / 550)),
      modeloPainel: pick(MODELOS_PAINEL, seed),
      qtdInversores: potencia > 20 ? 2 : 1,
      modeloInversor: pick(MODELOS_INVERSOR, seed >> 1),
      estrutura: pick(ESTRUTURAS, seed >> 2),
      tipoTelhado: pick(["Cerâmico", "Metálico", "Laje", "Fibrocimento"], seed >> 3),
      inclinacao: `${10 + (seed % 20)}°`,
      orientacaoSolar: pick(["Norte", "Nordeste", "Noroeste", "Leste"], seed >> 4),
      areaDisponivel: `${Math.round(potencia * 6)} m²`,
      sombreamento: pick(["Nenhum", "Parcial no período da tarde", "Baixo"], seed >> 5),
    },

    projetoSolar: {
      projetoEnviado: seed % 3 !== 0,
      art: seed % 4 !== 0,
      diagramaUnifilar: seed % 5 !== 0,
      homologacao,
      dataAprovacao: homologacao === "aprovada" ? daysAgo(seed % 15) : undefined,
      numeroProjeto: `PRJ-${seed % 90000}`,
      responsavelTecnico: pick(["Eng. Camila Rocha", "Eng. Diego Farias", "Eng. Priscila Nunes"], seed >> 1),
    },

    financeiro: {
      valorProjeto,
      valorEquipamentos,
      valorInstalacao,
      comissao,
      lucro,
      margem,
      entrada: Math.round(valorProjeto * 0.2),
      parcelas: pick([12, 24, 36, 48, 60], seed),
      banco: pick(["BV Financeira", "Santander", "Sicredi", "-"], seed >> 2),
      taxa: Math.round((1.2 + (seed % 10) / 10) * 100) / 100,
      situacao: pick(["pendente", "aprovado", "em_analise", "nao_se_aplica"] as const, seed >> 3),
    },

    instalacao: {
      equipe: pick(["Equipe Norte", "Equipe Sul", "Equipe Ydea 1", "Equipe Ydea 2"], seed >> 4),
      dataAgendada: instalacaoStatus !== "nao_agendada" ? daysAhead(seed % 20) : undefined,
      dataExecutada: instalacaoStatus === "concluida" ? daysAgo(seed % 10) : undefined,
      status: instalacaoStatus,
      checklistConcluido,
      checklistTotal,
      pendencias: checklistConcluido < checklistTotal ? "Falta confirmar material no estoque." : undefined,
    },

    documentos,
    timeline,

    ia: {
      chanceFechar: 30 + (seed % 65),
      ultimaInteracaoDias: 1 + (seed % 10),
      recomendacao:
        docsEnviados < DOC_TIPOS.length
          ? "Falta apenas o contrato. Recomenda-se enviar lembrete."
          : "Todos os documentos enviados. Pronto para avançar de etapa.",
      economiaAnualEstimada: Math.round(consumoMedio * 12 * 0.75),
      paybackAnos: Math.round((valorProjeto / Math.max(1, consumoMedio * 12 * 0.75)) * 10) / 10,
    },
  };
}

export { stageLabel, funnelName };
