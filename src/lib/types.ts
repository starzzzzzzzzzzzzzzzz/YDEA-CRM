export type FunnelId =
  | "comercial"
  | "engenharia"
  | "pos_acompanhamento"
  | "pos_nps"
  | "pos_gestao_energetica"
  | "pos_ampliacao";

export type Stage = { id: string; label: string; emoji?: string };

export type Funnel = {
  id: FunnelId;
  name: string;
  stages: Stage[];
};

// --- Papéis e usuários (RBAC) ---
// Os dados (cargos, permissões, cargo_permissões, usuários) vivem em src/lib/db,
// simulando tabelas de um banco relacional — nada disso fica fixo no código das telas.

export type CargoId =
  | "admin"
  | "vendedor"
  | "projetista"
  | "financeiro"
  | "instalacao"
  | "pos_venda";

export type Cargo = {
  id: CargoId;
  nome: string;
  descricao: string;
};

export type Permissao = {
  id: string;
  nome: string;
};

export type CargoPermissao = {
  cargoId: CargoId;
  permissaoId: string;
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  iniciais: string;
  cargoId: CargoId;
  /** Campos opcionais de perfil — nem todo usuário antigo tem isso preenchido ainda. */
  sobrenome?: string;
  telefone?: string;
  /** URL da foto de perfil no Firebase Storage (usuarios/{uid}/foto). */
  fotoUrl?: string;
  /** Unidade/franquia à qual o usuário pertence — ver lib/db/unidades.ts. */
  unidadeId?: string;
};

export type DashboardWidget = {
  id: string;
  nome: string;
  cargoId: CargoId;
  ordem: number;
  componente: string;
  span?: 1 | 2 | 3 | 4;
};

export type DealPrioridade = "baixa" | "media" | "alta";
export type DealStatus = "aberto" | "ganho" | "perdido";
export type PerfilCliente = "residencial" | "comercial" | "rural" | "industrial" | "condominio";

export const PERFIL_CLIENTE_LABEL: Record<PerfilCliente, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  rural: "Rural",
  industrial: "Industrial",
  condominio: "Condomínio",
};

export type DocumentoTipo =
  | "conta_energia"
  | "cpf"
  | "rg"
  | "cnh"
  | "comprovante"
  | "kit_fotovoltaico"
  | "projeto"
  | "drone";

export const DOCUMENTO_LABEL: Record<DocumentoTipo, string> = {
  conta_energia: "Conta de energia",
  cpf: "CPF",
  rg: "RG",
  cnh: "CNH",
  comprovante: "Comprovante de residência",
  kit_fotovoltaico: "Kit fotovoltaico",
  projeto: "Projeto",
  drone: "Imagens de drone",
};

export type DocumentoAnexo = {
  id: string;
  tipo: DocumentoTipo;
  nome: string;
  tamanho: number;
  previewUrl?: string;
  /** Caminho no Firebase Storage — necessário pra poder excluir o arquivo depois. */
  storagePath?: string;
  uploadedAt?: string;
};

/** Anotação/comentário no negócio (aba "Anotações"). */
export type Anotacao = {
  id: string;
  texto: string;
  autorId: string;
  autorNome: string;
  criadoEm: string; // ISO datetime
};

export type AtividadeTipo = "ligacao" | "reuniao" | "visita" | "email" | "tarefa" | "whatsapp";

export const ATIVIDADE_TIPO_LABEL: Record<AtividadeTipo, string> = {
  ligacao: "Ligação",
  reuniao: "Reunião",
  visita: "Visita",
  email: "E-mail",
  tarefa: "Tarefa",
  whatsapp: "WhatsApp",
};

/** Atividade agendada vinculada ao negócio (aba "Atividades"). */
export type Atividade = {
  id: string;
  tipo: AtividadeTipo;
  titulo: string;
  prioridade: DealPrioridade;
  data: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFim: string; // HH:mm
  responsavelId: string;
  responsavelNome: string;
  observacoes?: string;
  concluida: boolean;
  criadoEm: string;
};

export type Deal = {
  id: string;
  funnelId: FunnelId;
  stageId: string;
  titulo: string;
  valor: number;
  responsavel: string;
  createdAt?: string;

  // Relacionamentos
  organizacaoId?: string;
  pessoaId?: string;

  // Dados do negócio
  previsaoFechamento?: string;
  canalOrigem?: string;
  prioridade?: DealPrioridade;
  probabilidade?: number;
  temperatura?: Temperatura;
  status?: DealStatus;

  // Unidade consumidora
  distribuidora?: string;
  contaContrato?: string;
  numeroUC?: string;
  classeConsumidora?: string;
  grupoTarifario?: string;
  modalidadeTarifaria?: string;
  fase?: string;
  tensao?: string;
  consumoMedio?: number;
  cargaInstalada?: number;
  demandaContratada?: number;

  // Projeto solar
  potenciaSistema?: number;
  valorProjeto?: number;
  tipoTelhado?: string;
  estrutura?: string;
  inclinacao?: number;
  orientacao?: string;
  area?: number;
  drone?: boolean;
  trocaTitularidade?: boolean;
  validadeProposta?: string;

  // Campos adicionais observados no negócio real (perfil, concessionária, NPS)
  perfilCliente?: PerfilCliente;
  concessionaria?: string;
  npsVenda?: number;
  npsInstalacao?: number;
  npsPosVenda?: number;

  // Ganho/Perdido
  motivoPerda?: string;
  fechadoEm?: string;

  documentos?: DocumentoAnexo[];
  observacoes?: string;
};

// --- Organizações & Pessoas (usados no fluxo de criação de Negócio) ---

export type TipoOrganizacao = "PF" | "PJ";

export type Organizacao = {
  id: string;
  nome: string;
  tipo: TipoOrganizacao;
  cpf?: string;
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  responsavel?: string;
  canalOrigem?: string;
  tags: string[];
  observacoes?: string;
};

export type Pessoa = {
  id: string;
  organizacaoId?: string;
  nome: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  cargo?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  responsavel?: string;
  canalOrigem?: string;
  observacoes?: string;
};

// --- Leads / Instalações ---

export type LeadTipo = "residencial" | "comercial" | "rural";

export const TIPO_LABEL: Record<LeadTipo, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  rural: "Rural",
};

export type StageId =
  | "novo_lead"
  | "vistoria"
  | "documentacao"
  | "projeto"
  | "homologacao"
  | "instalacao"
  | "comissionamento"
  | "concluido";

export const STAGES: { id: StageId; label: string }[] = [
  { id: "novo_lead", label: "Novo lead" },
  { id: "vistoria", label: "Vistoria" },
  { id: "documentacao", label: "Documentação" },
  { id: "projeto", label: "Projeto" },
  { id: "homologacao", label: "Homologação" },
  { id: "instalacao", label: "Instalação" },
  { id: "comissionamento", label: "Comissionamento" },
  { id: "concluido", label: "Concluído" },
];

export type Lead = {
  id: string;
  cliente: string;
  local: string;
  tipo: LeadTipo;
  stage: StageId;
  potenciaKwp?: number;
  valor: number;
  responsavel: string;
  tags: string[];
};

// --- Clientes (Cadastro) ---

export type TipoPessoa = "PF" | "PJ";

export const TIPO_PESSOA_LABEL: Record<TipoPessoa, string> = {
  PF: "Pessoa Física",
  PJ: "Pessoa Jurídica",
};

export type ClienteStatus = "novo" | "em_negociacao" | "cliente_ativo" | "inativo";

export const STATUS_LABEL: Record<ClienteStatus, string> = {
  novo: "Novo",
  em_negociacao: "Em negociação",
  cliente_ativo: "Cliente ativo",
  inativo: "Inativo",
};

export const CLIENTE_STATUS_STYLE: Record<ClienteStatus, string> = {
  novo: "bg-panel-bg text-text-gray",
  em_negociacao: "bg-badge-blue-bg text-badge-blue-text",
  cliente_ativo: "bg-badge-green-bg text-badge-green-text",
  inativo: "bg-panel-bg text-text-faint",
};

export type Temperatura = "frio" | "morno" | "quente";

export const TEMPERATURA_LABEL: Record<Temperatura, string> = {
  frio: "Frio",
  morno: "Morno",
  quente: "Quente",
};

export type Cliente = {
  id: string;
  codigo: string;
  createdAt: string;

  // Dados básicos
  tipoPessoa: TipoPessoa;
  nome: string;
  nomeFantasia?: string;
  razaoSocial?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  inscricaoEstadual?: string;
  dataNascimento?: string;
  estadoCivil?: string;
  profissao?: string;
  empresa?: string;
  cargo?: string;

  // Contatos
  telefone: string;
  telefoneSecundario?: string;
  whatsapp: string;
  email: string;
  emailSecundario?: string;
  site?: string;

  // Endereço
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  referencia?: string;

  // Informações comerciais
  origem?: string;
  canal?: string;
  responsavel: string;
  score?: number;
  temperatura: Temperatura;
  status: ClienteStatus;
  tags: string[];
  observacoes?: string;

  // Dados energéticos
  distribuidora?: string;
  unidadeConsumidora?: string;
  classeConsumidora?: string;
  grupoTarifario?: string;
  consumoMedio?: number;
  tipoLigacao?: string;

  // Dados financeiros
  formaPagamento?: string;
  condicaoPagamento?: string;
};
