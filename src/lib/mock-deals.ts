import { Deal } from "./types";

export const MOCK_DEALS: Deal[] = [
  // Comercial
  { id: "c1", funnelId: "comercial", stageId: "novo_cliente", titulo: "Marina Albuquerque Ferreira", valor: 18500, responsavel: "FG", canalOrigem: "Site", distribuidora: "Cosern", potenciaSistema: 5.4, status: "aberto", createdAt: "2026-07-18" },
  { id: "c2", funnelId: "comercial", stageId: "novo_cliente", titulo: "Distribuidora Bom Preço LTDA", valor: 142000, responsavel: "YD", canalOrigem: "Indicação", distribuidora: "Cosern", potenciaSistema: 38, status: "aberto", createdAt: "2026-07-15" },
  { id: "c3", funnelId: "comercial", stageId: "primeiro_contato", titulo: "Heitor Nascimento Braga", valor: 9800, responsavel: "FG", canalOrigem: "Instagram", distribuidora: "Cosern", potenciaSistema: 3.2, status: "aberto", createdAt: "2026-07-10" },
  { id: "c4", funnelId: "comercial", stageId: "elaboracao_proposta", titulo: "Sítio Vale Verde", valor: 54000, responsavel: "JC", canalOrigem: "Indicação", distribuidora: "Equatorial", potenciaSistema: 16, status: "aberto", createdAt: "2026-06-28" },
  { id: "c5", funnelId: "comercial", stageId: "proposta_enviada", titulo: "Camila dos Reis Tavares", valor: 21400, responsavel: "FG", canalOrigem: "WhatsApp", distribuidora: "Cosern", potenciaSistema: 6.6, status: "aberto", createdAt: "2026-06-22" },
  { id: "c6", funnelId: "comercial", stageId: "negociacao", titulo: "Auto Peças Norte Rio", valor: 68500, responsavel: "YD", canalOrigem: "Site", distribuidora: "Cosern", potenciaSistema: 19, status: "aberto", createdAt: "2026-06-10" },
  { id: "c7", funnelId: "comercial", stageId: "negociacao", titulo: "Renato Cavalcanti Lopes", valor: 15200, responsavel: "FG", canalOrigem: "Facebook", distribuidora: "Equatorial", potenciaSistema: 4.8, status: "aberto", createdAt: "2026-06-04" },
  { id: "c8", funnelId: "comercial", stageId: "aguardando_financiamento", titulo: "Farmácia Vida Plena", valor: 39900, responsavel: "JC", canalOrigem: "Indicação", distribuidora: "Cosern", potenciaSistema: 11, status: "aberto", createdAt: "2026-05-20" },
  { id: "c9", funnelId: "comercial", stageId: "contrato", titulo: "Beatriz Monteiro Xavier", valor: 27300, responsavel: "YD", canalOrigem: "Site", distribuidora: "Cosern", potenciaSistema: 7.8, status: "ganho", createdAt: "2026-05-02" },
  { id: "c10", funnelId: "comercial", stageId: "contrato", titulo: "Padaria Sabor Real", valor: 33500, responsavel: "FG", canalOrigem: "Indicação", distribuidora: "Cosern", potenciaSistema: 9.2, status: "ganho", createdAt: "2026-04-14" },
  { id: "c11", funnelId: "comercial", stageId: "contrato", titulo: "Rafael Andrade Cunha", valor: 24800, responsavel: "JC", canalOrigem: "WhatsApp", distribuidora: "Equatorial", potenciaSistema: 6.9, status: "ganho", createdAt: "2026-04-02" },
  { id: "c12", funnelId: "comercial", stageId: "contrato", titulo: "Oficina Mecânica Silva", valor: 46200, responsavel: "YD", canalOrigem: "Site", distribuidora: "Cosern", potenciaSistema: 13, status: "ganho", createdAt: "2026-03-22" },
  { id: "c13", funnelId: "comercial", stageId: "contrato", titulo: "Vanessa Lima Barreto", valor: 19700, responsavel: "FG", canalOrigem: "Instagram", distribuidora: "Cosern", potenciaSistema: 5.7, status: "ganho", createdAt: "2026-03-08" },
  { id: "c14", funnelId: "comercial", stageId: "contrato", titulo: "Mercadinho Bom Jesus", valor: 31000, responsavel: "JC", canalOrigem: "Indicação", distribuidora: "Equatorial", potenciaSistema: 8.6, status: "ganho", createdAt: "2026-02-18" },
  { id: "c15", funnelId: "comercial", stageId: "novo_cliente", titulo: "Igor Salustiano Prado", valor: 12300, responsavel: "FG", canalOrigem: "Facebook", distribuidora: "Cosern", potenciaSistema: 3.8, status: "perdido", createdAt: "2026-02-01" },

  // Engenharia
  { id: "e1", funnelId: "engenharia", stageId: "onboard", titulo: "Condomínio Jardins do Sol", valor: 210000, responsavel: "JC" },
  { id: "e2", funnelId: "engenharia", stageId: "onboard", titulo: "Igreja Comunidade Viva", valor: 32000, responsavel: "YD" },
  { id: "e3", funnelId: "engenharia", stageId: "visita_tecnica", titulo: "Pousada Mar Aberto", valor: 47500, responsavel: "FG" },
  { id: "e4", funnelId: "engenharia", stageId: "projeto", titulo: "Colégio Novo Horizonte — Campus Leste", valor: 168000, responsavel: "JC" },
  { id: "e5", funnelId: "engenharia", stageId: "projeto_analise", titulo: "Metalúrgica Rio Grande", valor: 305000, responsavel: "YD" },
  { id: "e6", funnelId: "engenharia", stageId: "projeto_analise", titulo: "Clínica Odontológica Sorriso", valor: 22800, responsavel: "JC" },
  { id: "e7", funnelId: "engenharia", stageId: "instalacao_comissionamento", titulo: "Supermercado Popular", valor: 91000, responsavel: "FG" },
  { id: "e8", funnelId: "engenharia", stageId: "vistoria", titulo: "Fazenda Três Irmãos", valor: 129000, responsavel: "YD" },
  { id: "e9", funnelId: "engenharia", stageId: "vistoria", titulo: "Residencial Alto da Serra", valor: 26500, responsavel: "JC" },
  { id: "e10", funnelId: "engenharia", stageId: "ligacao", titulo: "Padaria Pão Dourado", valor: 14200, responsavel: "FG" },

  // Pós - Acompanhamento
  { id: "pa1", funnelId: "pos_acompanhamento", stageId: "on_board", titulo: "Eduarda Lins Pereira", valor: 0, responsavel: "YD" },
  { id: "pa2", funnelId: "pos_acompanhamento", stageId: "substituicao_medidor", titulo: "Osvaldo Bezerra Campos", valor: 16000, responsavel: "JC" },
  { id: "pa3", funnelId: "pos_acompanhamento", stageId: "mes_1", titulo: "Vitória Almeida Rocha", valor: 0, responsavel: "FG" },
  { id: "pa4", funnelId: "pos_acompanhamento", stageId: "mes_2", titulo: "Gráfica Ideal", valor: 12500, responsavel: "YD" },
  { id: "pa5", funnelId: "pos_acompanhamento", stageId: "mes_3", titulo: "Roberto Farias Guimarães", valor: 0, responsavel: "JC" },
  { id: "pa6", funnelId: "pos_acompanhamento", stageId: "mes_4_5", titulo: "Sandra Lúcia Pontes", valor: 8300, responsavel: "FG" },
  { id: "pa7", funnelId: "pos_acompanhamento", stageId: "negociacao_comercial", titulo: "Loja Estilo & Cia", valor: 4200, responsavel: "YD" },

  // Pós - NPS
  { id: "n1", funnelId: "pos_nps", stageId: "nps_comercial", titulo: "Fábio Andrade Siqueira (NPS)", valor: 0, responsavel: "JC" },
  { id: "n2", funnelId: "pos_nps", stageId: "nps_comercial", titulo: "Letícia Moura Cardoso (NPS)", valor: 0, responsavel: "YD" },
  { id: "n3", funnelId: "pos_nps", stageId: "nps_pos_venda", titulo: "Hotel Recanto das Águas (NPS)", valor: 18000, responsavel: "FG" },
  { id: "n4", funnelId: "pos_nps", stageId: "nps_pos_venda", titulo: "Marcelo Teixeira Duarte (NPS)", valor: 9500, responsavel: "JC" },

  // Pós - Gestão Energética
  { id: "g1", funnelId: "pos_gestao_energetica", stageId: "ponto_contato_1", titulo: "Simone Barros Cunha", valor: 29.9, responsavel: "FG" },
  { id: "g2", funnelId: "pos_gestao_energetica", stageId: "ponto_contato_1", titulo: "Adão Ferreira Melo", valor: 39.9, responsavel: "YD" },
  { id: "g3", funnelId: "pos_gestao_energetica", stageId: "ponto_contato_2", titulo: "Regina Célia Souto", valor: 26, responsavel: "JC" },
  { id: "g4", funnelId: "pos_gestao_energetica", stageId: "ponto_contato_2", titulo: "Fábrica de Móveis Vitória", valor: 39.9, responsavel: "FG" },

  // Pós - Ampliação e serviços adicionais
  { id: "am1", funnelId: "pos_ampliacao", stageId: "necessidade_interesse", titulo: "Cristiane Nogueira Peixoto", valor: 0, responsavel: "YD" },
  { id: "am2", funnelId: "pos_ampliacao", stageId: "necessidade_interesse", titulo: "Wellington Cordeiro Dias", valor: 0, responsavel: "JC" },
  { id: "am3", funnelId: "pos_ampliacao", stageId: "elaboracao_proposta", titulo: "Studio de Pilates Equilíbrio", valor: 6200, responsavel: "FG" },
];
