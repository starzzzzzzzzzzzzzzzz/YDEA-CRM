/**
 * Tipos do gerador de propostas. Só tipos (nenhum código executável) —
 * assim o motor de cálculo roda em testes sem depender do Next/Firebase.
 */

export type FaseRede = "monofasico" | "bifasico" | "trifasico";

export const FASE_LABEL: Record<FaseRede, string> = {
  monofasico: "Monofásico",
  bifasico: "Bifásico",
  trifasico: "Trifásico",
};

export type ModoKit = "sistema" | "manual";

export type ItemComplementar = {
  id: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  /** Aplica o gross-up de imposto (13,58%) sobre o valor do item. */
  aplicaImposto: boolean;
};

export type ModuloKit = {
  marca: string;
  modelo: string;
  potenciaW: number;
  /** Quantidade manual; vazio = usa a quantidade calculada pelo dimensionamento. */
  quantidade?: number;
  larguraMm?: number;
  comprimentoMm?: number;
  valorUnitario: number;
  garantiaDesempenhoAnos?: number;
  garantiaFabricacaoAnos?: number;
};

export type InversorKit = {
  id: string;
  marca: string;
  modelo: string;
  potenciaKw: number;
  tensaoSaida: string;
  fase: FaseRede;
  potenciaMaximaVA?: number;
  valorUnitario: number;
  quantidade: number;
  garantiaFabricacaoAnos?: number;
};

export type OutroItemKit = {
  id: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
};

/** Tudo o que o usuário preenche nas 4 etapas do wizard. */
export type PropostaDados = {
  // Etapa 1 — Dados do cliente e projeto
  tipoProposta: "solar";
  modeloPrecificacao: "nova";
  nomeProjeto: string;
  consultorNome: string;
  consultorEmail: string;
  consultorTelefone: string;
  enderecoBase: string;
  dealId?: string;
  clienteId?: string;
  clienteNome: string;
  clienteCpfCnpj: string;
  clienteEmail: string;
  clienteContato: string;
  clienteOrganizacao: string;
  clienteProfissao: string;
  /** Endereço do cliente (residência/sede) — vai no contrato; o da usina é outro. */
  clienteEndereco: string;
  usarEnderecoCliente: boolean;
  usinaRua: string;
  usinaNumero: string;
  usinaBairro: string;
  usinaCidade: string;
  usinaEstado: string;
  usinaCep: string;
  usinaObservacao: string;

  // Etapa 2 — Dimensionamento técnico e fatura
  concessionaria: string;
  /** Subgrupo tarifário da concessionária (define as tarifas buscadas na ANEEL). */
  perfilConcessionaria: "B1" | "B2" | "B3";
  codigoUC: string;
  fase: FaseRede;
  tensao: string;
  consumoMedioKwh: number;
  tarifaTE: number;
  tarifaTUSD: number;
  tarifaFioB: number;
  taxasAntesSolar: number;
  taxasDepoisSolar: number;
  considerarCreditoNoPayback: boolean;
  /** Em %, como aparece na tela (75 = 75%). */
  taxaDesempenhoPct: number;
  /** Em Wh/m²·dia, como aparece na tela (5788,50). */
  irradiacaoWhM2Dia: number;
  tipoEstrutura: string;
  incluirEstruturaEm: "kit" | "complementares";
  maoDeObra: string;
  /** ISO (YYYY-MM-DD). Nasce como hoje + 7 dias. */
  validade: string;
  observacao: string;

  // Etapa 3 — Kit e precificação
  modoKit: ModoKit;
  modulo: ModuloKit;
  inversores: InversorKit[];
  outrosKit: OutroItemKit[];
  /** Se preenchido, substitui a soma automática dos itens do kit. */
  precoKitManual?: number;
  complementares: ItemComplementar[];
  incluirInstalacao: boolean;
  incluirComissao: boolean;

  // Etapa 4 — Pós-dimensionamento (campos customizados)
  osNumero: string;
  osDataInicio: string;
  osDataFim: string;
  osColaborador: string;
  osColaboradorCpf: string;
  infoContrato: string;
  nacionalidade: string;
  clausula211: string;
  clausula212: string;
};

export type LinhaComplementar = ItemComplementar & {
  valorTotal: number;
  impostoPago: number;
  valorComImposto: number;
};

export type LinhaProjecao = {
  ano: number;
  anoCalendario: number;
  geracaoKwh: number;
  fatorDegradacao: number;
  economia: number;
  fluxoAcumulado: number;
};

export type ResultadoProposta = {
  // Dimensionamento
  geracaoEspecificaKwhKwpMes: number;
  custoDisponibilidadeKwh: number;
  kwpNecessario: number;
  quantidadeModulosCalculada: number;
  quantidadeModulos: number;
  potenciaRealKwp: number;
  areaUnitariaM2: number;
  areaTotalM2: number;
  geracaoMensalKwh: number;
  geracaoAnualKwh: number;
  reducaoCo2ToneladasAno: number;

  // Precificação
  valorKit: number;
  complementares: LinhaComplementar[];
  totalComplementaresComImposto: number;
  instalacao: LinhaComplementar | null;
  comissao: number;
  impostoPagoTotal: number;
  valorTotal: number;
  valorTotalSemImpostos: number;
  precoPorKwp: number;

  // Projeção financeira
  projecao: LinhaProjecao[];
  economiaMensalAno1: number;
  paybackAnos: number | null;
};

export type PropostaStatus = "rascunho" | "finalizada";

/** Proposta como fica gravada no Firestore (coleção `propostas`). */
export type PropostaSalva = {
  id: string;
  /** Número sequencial exibido na capa ("Número da Proposta: 303"). */
  numero: number;
  status: PropostaStatus;
  dealId?: string;
  clienteNome: string;
  nomeProjeto: string;
  valorTotal: number;
  potenciaKwp: number;
  criadoEm: string; // ISO datetime
  atualizadoEm: string; // ISO datetime
  criadoPorId: string;
  criadoPorNome: string;
  dados: PropostaDados;
};

/** Equipamentos cadastrados (coleções `catalogo_modulos` e `catalogo_inversores`). */
export type CatalogoModulo = {
  id: string;
  marca: string;
  modelo: string;
  potenciaW: number;
  larguraMm?: number;
  comprimentoMm?: number;
  valorUnitario?: number;
  garantiaDesempenhoAnos?: number;
  garantiaFabricacaoAnos?: number;
};

export type CatalogoInversor = {
  id: string;
  marca: string;
  modelo: string;
  potenciaKw: number;
  tensaoSaida: string;
  fase: FaseRede;
  potenciaMaximaVA?: number;
  valorUnitario?: number;
  garantiaFabricacaoAnos?: number;
};
