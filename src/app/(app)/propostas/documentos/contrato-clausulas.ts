/**
 * Cláusulas GERAIS do contrato comercial.
 *
 * ⚠ TEXTO PROVISÓRIO — escrito como estrutura de apoio, NÃO é modelo jurídico revisado.
 * Substitua pelo texto do contrato atual da Ydea (ou da assessoria jurídica) e só então
 * troque CONTRATO_TEXTO_REVISADO para true. Enquanto for false, o contrato não imprime.
 *
 * Os marcadores {{assim}} são trocados por preencherPlaceholders(); campo vazio vira "-".
 */
export const CONTRATO_TEXTO_REVISADO = false;

export type SecaoContrato = { titulo: string; itens: string[] };

export const CLAUSULAS_OBRIGACOES: SecaoContrato[] = [
  {
    titulo: "CLÁUSULA 4ª — DAS OBRIGAÇÕES DA CONTRATADA",
    itens: [
      "4.1. Fornecer os equipamentos descritos na Cláusula 1ª, novos e de acordo com as especificações da proposta nº {{numero_proposta}}.",
      "4.2. Executar a instalação do sistema fotovoltaico por profissionais habilitados, observando as normas técnicas aplicáveis e as exigências da concessionária {{concessionaria}}.",
      "4.3. Elaborar o projeto e acompanhar o processo de homologação junto à concessionária.",
    ],
  },
  {
    titulo: "CLÁUSULA 5ª — DAS OBRIGAÇÕES DA CONTRATANTE",
    itens: [
      "5.1. Efetuar os pagamentos nas condições da Cláusula 2ª.",
      "5.2. Garantir o livre acesso ao local da instalação ({{endereco_usina}}) nos dias e horários combinados.",
      "5.3. Fornecer a documentação necessária à homologação junto à concessionária.",
    ],
  },
];

export const CLAUSULAS_GARANTIAS: SecaoContrato[] = [
  {
    titulo: "CLÁUSULA 6ª — DAS GARANTIAS",
    itens: [
      "6.1. Os equipamentos possuem as garantias dos respectivos fabricantes, nos prazos informados na Cláusula 1ª.",
      "6.2. A garantia não cobre danos causados por mau uso, intervenção de terceiros não autorizados ou eventos da natureza.",
    ],
  },
  {
    titulo: "CLÁUSULA 7ª — DA RESCISÃO",
    itens: [
      "7.1. O descumprimento de qualquer cláusula por uma das partes autoriza a outra a rescindir o contrato, mediante notificação por escrito.",
    ],
  },
];
