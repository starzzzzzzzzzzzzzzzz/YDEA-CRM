/**
 * Motor de regras e fórmulas do gerador de propostas.
 * Funções puras — sem React, sem Firebase — para poderem ser testadas isoladamente.
 * Todas as regras de negócio do gerador vivem aqui; as telas e os PDFs só consomem.
 */
import type {
  FaseRede,
  ItemComplementar,
  LinhaComplementar,
  LinhaProjecao,
  PropostaDados,
  ResultadoProposta,
} from "./types";

// --- Constantes de negócio ----------------------------------------------------

/** Custo de disponibilidade (kWh/mês) cobrado mesmo com geração compensando tudo. */
export const CUSTO_DISPONIBILIDADE_KWH: Record<FaseRede, number> = {
  monofasico: 30,
  bifasico: 50,
  trifasico: 100,
};

/** Imposto embutido nos itens complementares (gross-up). */
export const ALIQUOTA_IMPOSTO = 0.1358;
/** Comissão do vendedor embutida no preço (gross-up). */
export const ALIQUOTA_COMISSAO = 0.03;
/** Mão de obra de instalação, por módulo (R$). */
export const MAO_DE_OBRA_POR_MODULO = 80;
/** Taxa de desempenho padrão (%). */
export const TAXA_DESEMPENHO_PADRAO_PCT = 75;
/** Irradiação padrão (Wh/m²·dia). */
export const IRRADIACAO_PADRAO_WH_M2_DIA = 5788.5;
/** Validade padrão da proposta, em dias a partir de hoje. */
export const VALIDADE_PADRAO_DIAS = 7;

/**
 * PREMISSAS ASSUMIDAS (não vieram das regras de negócio — confirmar com a Ydea).
 * Ficam centralizadas aqui para trocar num lugar só.
 */
export const PREMISSAS = {
  /** Degradação anual dos módulos (%), aplicada a partir do 2º ano. */
  degradacaoAnualPct: 0.5,
  /** Reajuste anual da tarifa de energia (%). */
  reajusteTarifaAnualPct: 5,
  /** Fator de emissão da rede (tCO₂ por MWh gerado). */
  fatorEmissaoTco2PorMwh: 0.0385,
  /** Horizonte da projeção (anos). */
  anosProjecao: 25,
};

/**
 * Parcela do Fio B cobrada sobre a energia compensada (Lei 14.300, regra de transição).
 * Por ano-calendário; a partir de 2029 é 100%.
 */
export function percentualFioB(anoCalendario: number): number {
  const tabela: Record<number, number> = {
    2023: 0.15,
    2024: 0.3,
    2025: 0.45,
    2026: 0.6,
    2027: 0.75,
    2028: 0.9,
  };
  if (anoCalendario < 2023) return 0;
  return tabela[anoCalendario] ?? 1;
}

// --- Utilidades numéricas -----------------------------------------------------

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Wh/m²·dia → kWh/m²·dia (unidade padronizada na exibição). */
export function whParaKwh(wh: number): number {
  return wh / 1000;
}

/** Gross-up: valor que, descontada a alíquota, devolve a base. base / (1 − alíquota). */
export function grossUp(base: number, aliquota: number): number {
  if (aliquota < 0 || aliquota >= 1) throw new Error("Alíquota deve estar entre 0 e 1 (exclusive).");
  return round2(base / (1 - aliquota));
}

// --- Dimensionamento ----------------------------------------------------------

/** Geração específica (kWh/kWp·mês) = irradiação (kWh/m²·dia) × 365/12 × desempenho. */
export function geracaoEspecifica(irradiacaoWhM2Dia: number, taxaDesempenhoPct: number): number {
  return whParaKwh(irradiacaoWhM2Dia) * (365 / 12) * (taxaDesempenhoPct / 100);
}

export function custoDisponibilidade(fase: FaseRede): number {
  return CUSTO_DISPONIBILIDADE_KWH[fase];
}

/** kWp necessário = (consumo médio − custo de disponibilidade) / geração específica. */
export function kwpNecessario(consumoMedioKwh: number, fase: FaseRede, geracaoEspecificaKwhKwpMes: number): number {
  if (geracaoEspecificaKwhKwpMes <= 0) return 0;
  const aCompensar = Math.max(0, consumoMedioKwh - custoDisponibilidade(fase));
  return aCompensar / geracaoEspecificaKwhKwpMes;
}

/** Quantidade de módulos = ⌈ kWp × 1000 / potência do módulo (W) ⌉. */
export function quantidadeModulos(kwp: number, potenciaModuloW: number): number {
  if (potenciaModuloW <= 0 || kwp <= 0) return 0;
  // tolerância evita 58,0000000001 virar 59 por ruído de ponto flutuante
  return Math.ceil((kwp * 1000) / potenciaModuloW - 1e-9);
}

/** Potência real da usina (kWp) = módulos × potência do módulo. */
export function potenciaRealKwp(qtdModulos: number, potenciaModuloW: number): number {
  return (qtdModulos * potenciaModuloW) / 1000;
}

/** Área unitária do módulo (m²) a partir de largura × comprimento em mm. */
export function areaUnitariaM2(larguraMm?: number, comprimentoMm?: number): number {
  if (!larguraMm || !comprimentoMm) return 0;
  return (larguraMm * comprimentoMm) / 1_000_000;
}

/** Área ocupada = módulos × área unitária. */
export function areaOcupadaM2(qtdModulos: number, areaUnitaria: number): number {
  return qtdModulos * areaUnitaria;
}

/** Redução de CO₂ em toneladas/ano. */
export function reducaoCo2ToneladasAno(geracaoAnualKwh: number): number {
  return (geracaoAnualKwh / 1000) * PREMISSAS.fatorEmissaoTco2PorMwh;
}

/** Distribui a geração anual pelos 12 meses, ponderando pelos dias de cada mês. */
export function geracaoPorMes(geracaoAnualKwh: number, ano: number): number[] {
  const dias = [31, (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const total = dias.reduce((a, b) => a + b, 0);
  return dias.map((d) => (geracaoAnualKwh * d) / total);
}

// --- Precificação -------------------------------------------------------------

/** Mão de obra de instalação = R$ 80,00 × quantidade de módulos. */
export function maoDeObraInstalacao(qtdModulos: number): number {
  return round2(MAO_DE_OBRA_POR_MODULO * qtdModulos);
}

/** Comissão embutida: devolve o preço com a comissão de 3% já dentro. */
export function precoComComissao(base: number): number {
  return grossUp(base, ALIQUOTA_COMISSAO);
}

export function calcularLinhaComplementar(item: ItemComplementar): LinhaComplementar {
  const valorTotal = round2(item.quantidade * item.valorUnitario);
  const valorComImposto = item.aplicaImposto ? grossUp(valorTotal, ALIQUOTA_IMPOSTO) : valorTotal;
  return { ...item, valorTotal, impostoPago: round2(valorComImposto - valorTotal), valorComImposto };
}

export function valorDoKit(dados: PropostaDados, qtdModulos: number): number {
  if (dados.precoKitManual !== undefined && dados.precoKitManual > 0) return round2(dados.precoKitManual);
  const modulos = qtdModulos * dados.modulo.valorUnitario;
  const inversores = dados.inversores.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const outros = dados.outrosKit.reduce((s, o) => s + o.quantidade * o.valorUnitario, 0);
  return round2(modulos + inversores + outros);
}

// --- Projeção financeira ------------------------------------------------------

type EntradaProjecao = {
  geracaoMensalKwh: number;
  consumoMedioKwh: number;
  fase: FaseRede;
  tarifaTE: number;
  tarifaTUSD: number;
  tarifaFioB: number;
  taxasAntesSolar: number;
  taxasDepoisSolar: number;
  investimento: number;
  anoInicial: number;
};

/**
 * Fluxo de caixa de 25 anos. Por ano:
 *  conta antes  = consumo × (TE+TUSD) + taxas antes
 *  conta depois = (consumo − compensado) × (TE+TUSD) + compensado × FioB × %FioB + taxas depois
 *  economia     = antes − depois
 * Energia que excede o consumo não gera valor (créditos excedentes não são monetizados).
 */
export function projecaoFinanceira(e: EntradaProjecao): { linhas: LinhaProjecao[]; economiaMensalAno1: number; paybackAnos: number | null } {
  const { degradacaoAnualPct, reajusteTarifaAnualPct, anosProjecao } = PREMISSAS;
  const consumoAnual = e.consumoMedioKwh * 12;
  const dispAnual = custoDisponibilidade(e.fase) * 12;
  const passivelCompensar = Math.max(0, consumoAnual - dispAnual);

  const linhas: LinhaProjecao[] = [];
  let acumulado = -e.investimento;
  let payback: number | null = null;

  for (let ano = 1; ano <= anosProjecao; ano++) {
    const fatorDegradacao = Math.pow(1 - degradacaoAnualPct / 100, ano - 1);
    const reajuste = Math.pow(1 + reajusteTarifaAnualPct / 100, ano - 1);
    const anoCalendario = e.anoInicial + ano - 1;

    const geracao = e.geracaoMensalKwh * 12 * fatorDegradacao;
    const compensado = Math.min(geracao, passivelCompensar);
    const tarifa = (e.tarifaTE + e.tarifaTUSD) * reajuste;
    const fioB = e.tarifaFioB * percentualFioB(anoCalendario) * reajuste;

    const antes = consumoAnual * tarifa + e.taxasAntesSolar * 12;
    const depois = (consumoAnual - compensado) * tarifa + compensado * fioB + e.taxasDepoisSolar * 12;
    const economia = round2(antes - depois);

    const anterior = acumulado;
    acumulado = round2(acumulado + economia);
    if (payback === null && acumulado >= 0) {
      const fracao = economia > 0 ? -anterior / economia : 0;
      payback = round2(ano - 1 + fracao);
    }

    linhas.push({ ano, anoCalendario, geracaoKwh: round2(geracao), fatorDegradacao, economia, fluxoAcumulado: acumulado });
  }

  return { linhas, economiaMensalAno1: round2((linhas[0]?.economia ?? 0) / 12), paybackAnos: payback };
}

// --- Cálculo completo ---------------------------------------------------------

/**
 * Executa dimensionamento + precificação + projeção a partir do que o usuário preencheu.
 * É a ÚNICA fonte dos números: proposta, contrato e OS leem daqui (nada de digitar à mão).
 */
export function calcularProposta(dados: PropostaDados, hoje: Date = new Date()): ResultadoProposta {
  const gerEsp = geracaoEspecifica(dados.irradiacaoWhM2Dia, dados.taxaDesempenhoPct);
  const kwp = kwpNecessario(dados.consumoMedioKwh, dados.fase, gerEsp);
  const qtdCalculada = quantidadeModulos(kwp, dados.modulo.potenciaW);
  const qtd = dados.modulo.quantidade && dados.modulo.quantidade > 0 ? dados.modulo.quantidade : qtdCalculada;
  const potReal = potenciaRealKwp(qtd, dados.modulo.potenciaW);
  const areaUnit = areaUnitariaM2(dados.modulo.larguraMm, dados.modulo.comprimentoMm);

  const geracaoMensal = potReal * gerEsp;
  const geracaoAnual = geracaoMensal * 12;

  // Precificação
  const kit = valorDoKit(dados, qtd);
  const complementares = dados.complementares.map(calcularLinhaComplementar);
  const totalComplementares = round2(complementares.reduce((s, l) => s + l.valorComImposto, 0));

  // Instalação: a regra a trata à parte (R$ 80 × módulos); nas telas atuais ela leva imposto.
  const instalacao = dados.incluirInstalacao
    ? calcularLinhaComplementar({
        id: "instalacao",
        nome: "Instalação",
        quantidade: 1,
        valorUnitario: maoDeObraInstalacao(qtd),
        aplicaImposto: true,
      })
    : null;

  const subtotal = round2(kit + totalComplementares + (instalacao?.valorComImposto ?? 0));
  const valorTotal = dados.incluirComissao ? precoComComissao(subtotal) : subtotal;
  const comissao = round2(valorTotal - subtotal);

  const impostoPagoTotal = round2(
    complementares.reduce((s, l) => s + l.impostoPago, 0) + (instalacao?.impostoPago ?? 0)
  );

  const proj = projecaoFinanceira({
    geracaoMensalKwh: geracaoMensal,
    consumoMedioKwh: dados.consumoMedioKwh,
    fase: dados.fase,
    tarifaTE: dados.tarifaTE,
    tarifaTUSD: dados.tarifaTUSD,
    tarifaFioB: dados.tarifaFioB,
    taxasAntesSolar: dados.taxasAntesSolar,
    taxasDepoisSolar: dados.taxasDepoisSolar,
    investimento: valorTotal,
    anoInicial: hoje.getFullYear(),
  });

  return {
    geracaoEspecificaKwhKwpMes: gerEsp,
    custoDisponibilidadeKwh: custoDisponibilidade(dados.fase),
    kwpNecessario: kwp,
    quantidadeModulosCalculada: qtdCalculada,
    quantidadeModulos: qtd,
    potenciaRealKwp: potReal,
    areaUnitariaM2: areaUnit,
    areaTotalM2: areaOcupadaM2(qtd, areaUnit),
    geracaoMensalKwh: geracaoMensal,
    geracaoAnualKwh: geracaoAnual,
    reducaoCo2ToneladasAno: reducaoCo2ToneladasAno(geracaoAnual),
    valorKit: kit,
    complementares,
    totalComplementaresComImposto: totalComplementares,
    instalacao,
    comissao,
    impostoPagoTotal,
    valorTotal,
    valorTotalSemImpostos: round2(valorTotal - impostoPagoTotal),
    precoPorKwp: potReal > 0 ? round2(valorTotal / potReal) : 0,
    projecao: proj.linhas,
    economiaMensalAno1: proj.economiaMensalAno1,
    paybackAnos: proj.paybackAnos,
  };
}
