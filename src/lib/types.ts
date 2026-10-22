export interface InputDimensionamento {
  consumoMensal: number;
  tipoFase: 'monofasico' | 'bifasico' | 'trifasico';
  irradiancia: number;
  taxaDesempenho: number;
  potenciaModuloW: number;
  areaModuloM2: number;
  valorKitMaterial: number;
  valorComplementaresBase: number;
}

export interface ResultadoCalculoSolar {
  geracaoEspecifica: number;
  kwpNecessario: number;
  qtdModulos: number;
  kwpReal: number;
  areaEstimada: number;
  complementaresComImposto: number;
  valorInstalacao: number;
  valorSobreKit: number;
  valorComissao: number;
  valorTotalProposta: number;
  precoPorKwp: number;
}

export interface PropostaSolar {
  id?: string;
  idDeal?: string;
  status: 'rascunho' | 'gerada' | 'enviada' | 'aceita';
  nomeProjeto: string;
  cliente: {
    nome: string;
    cpfCnpj: string;
    email?: string;
    telefone?: string;
  };
  dadosEntrada: InputDimensionamento;
  calculos: ResultadoCalculoSolar;
  criadoEm: string;
  validadeDias: number; // Padrão: 7 dias
}
// ==========================================
// TIPOS E MAPEAMENTOS DO FUNIL E NEGÓCIOS (CRM)
// ==========================================

export type DealPrioridade = 'baixa' | 'media' | 'alta' | 'urgente';

export type AtividadeTipo = 'ligacao' | 'whatsapp' | 'reuniao' | 'visita' | 'email' | 'tarefa';

export const ATIVIDADE_TIPO_LABEL: Record<AtividadeTipo, string> = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  reuniao: 'Reunião',
  visita: 'Visita',
  email: 'E-mail',
  tarefa: 'Tarefa',
};

export const TEMPERATURA_LABEL: Record<string, string> = {
  frio: 'Frio',
  morno: 'Morno',
  quente: 'Quente',
};

export const PERFIL_CLIENTE_LABEL: Record<string, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  industrial: 'Industrial',
  rural: 'Rural',
};

export interface Anotacao {
  id?: string;
  texto: string;
  criadoEm: string;
  autor: string;
}

export interface Atividade {
  id?: string;
  tipo: AtividadeTipo;
  descricao: string;
  data: string;
  concluida: boolean;
}

export interface DocumentoAnexo {
  id?: string;
  nome: string;
  url: string;
}

export interface Deal {
  id?: string;
  titulo: string;
  clienteNome: string;
  valor: number;
  estagio: string;
  prioridade?: DealPrioridade;
  temperatura?: string;
  perfilCliente?: string;
  criadoEm?: string;
}
// ==========================================
// TIPOS E RÓTULOS DE DOCUMENTOS DO CRM
// ==========================================

export type DocumentoTipo = 
  | 'rg_cpf' 
  | 'cnh' 
  | 'comprovante_residencia' 
  | 'fatura_energia' 
  | 'cnpj' 
  | 'contrato_social' 
  | 'procuracao' 
  | 'outros';

export const DOCUMENTO_LABEL: Record<DocumentoTipo, string> = {
  rg_cpf: 'RG / CPF',
  cnh: 'CNH',
  comprovante_residencia: 'Comprovante de Residência',
  fatura_energia: 'Fatura de Energia',
  cnpj: 'Cartão CNPJ',
  contrato_social: 'Contrato Social',
  procuracao: 'Procuração',
  outros: 'Outros Documentos',
};