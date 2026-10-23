/** Opções fixas dos formulários do gerador de propostas (configuração, não dado de exemplo). */

export const TIPOS_ESTRUTURA = [
  "Estacionamento Monoposte",
  "Estacionamento Carport",
  "Estacionamento Biposte",
  "Sem Estrutura",
  "Solo Monoposte",
  "Solo Biposte",
  "Solo",
  "Telhado Fibrocimento",
  "Telhado Fibrometalica",
  "Telhado Shingle",
  "Telhado Ceramico - Orientação paisagem",
  "Telhado Ceramico - Orientação retrato",
  "Telhado Ceramico",
  "Telhado Laje",
  "Telhado Zipado",
  "Telhado Metalico",
  "Telhado Metalico - Mini trilho (0.5m)",
  "Telhado Metalico - Perfil contínuo (2.4m)",
  "Telhado Fibromadeira",
];

export const TENSOES_REDE = ["V127", "V220", "V380"];

export const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

/** Sugestões (o campo aceita qualquer texto). */
export const CONCESSIONARIAS_SUGERIDAS = ["COSERN - Neoenergia Cosern"];

export const NACIONALIDADE_PADRAO = "Brasileiro(a)";

/** Textos-modelo das cláusulas de pagamento do contrato. Enquanto tiverem marcador, o contrato não imprime. */
export const CLAUSULA_211_MODELO =
  "Pagamento no valor de R$ 00000 (VALOR POR ESCRITO) à vista, através de FORMA DE PAGAMENTO, como entrada.";
export const CLAUSULA_212_MODELO =
  "Pagamento no valor de R$ 0000 (VALOR POR ESCRITO), através de FORMA DE PAGAMENTO, na instalação do sistema fotovoltaico.";

export const FORO_CONTRATO = "Parelhas/RN";

/**
 * Dados da CONTRATADA que saem no contrato. PREENCHER antes de imprimir contratos:
 * razão social, CNPJ e representante legal ainda não foram informados.
 */
export const CONTRATADA = {
  razaoSocial: "Ydea Energia Solar",
  cnpj: "",
  representante: "",
};
