import { DashboardWidget } from "@/lib/types";

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  // Administrador — visão completa da empresa
  { id: "adm1", nome: "Pipeline", cargoId: "admin", ordem: 1, componente: "kpi.pipeline", span: 1 },
  { id: "adm2", nome: "Receita (mês)", cargoId: "admin", ordem: 2, componente: "kpi.receita_mes", span: 1 },
  { id: "adm3", nome: "Meta do mês", cargoId: "admin", ordem: 3, componente: "kpi.meta_mes", span: 1 },
  { id: "adm4", nome: "Conversão", cargoId: "admin", ordem: 4, componente: "kpi.conversao", span: 1 },
  { id: "adm5", nome: "Ticket médio", cargoId: "admin", ordem: 5, componente: "kpi.ticket_medio", span: 1 },
  { id: "adm6", nome: "Projetos instalados", cargoId: "admin", ordem: 6, componente: "kpi.projetos_instalados", span: 1 },
  { id: "adm7", nome: "Homologações", cargoId: "admin", ordem: 7, componente: "kpi.homologacoes", span: 1 },
  { id: "adm8", nome: "Propostas", cargoId: "admin", ordem: 8, componente: "kpi.propostas", span: 1 },
  { id: "adm9", nome: "Pipeline por etapa", cargoId: "admin", ordem: 9, componente: "chart.pipeline_etapa", span: 2 },
  { id: "adm10", nome: "Vendas por mês", cargoId: "admin", ordem: 10, componente: "chart.vendas_mes", span: 2 },
  { id: "adm11", nome: "Valor por funil", cargoId: "admin", ordem: 11, componente: "chart.funis", span: 2 },
  { id: "adm12", nome: "Origem dos negócios", cargoId: "admin", ordem: 12, componente: "chart.origem", span: 2 },
  { id: "adm13", nome: "Negócios por distribuidora", cargoId: "admin", ordem: 13, componente: "chart.distribuidoras", span: 2 },
  { id: "adm14", nome: "Potência vendida", cargoId: "admin", ordem: 14, componente: "chart.potencia", span: 2 },

  // Vendedor
  { id: "ven1", nome: "Minhas vendas", cargoId: "vendedor", ordem: 1, componente: "kpi.minhas_vendas", span: 1 },
  { id: "ven2", nome: "Leads", cargoId: "vendedor", ordem: 2, componente: "kpi.meus_leads", span: 1 },
  { id: "ven3", nome: "Propostas", cargoId: "vendedor", ordem: 3, componente: "kpi.propostas", span: 1 },
  { id: "ven4", nome: "Comissão estimada", cargoId: "vendedor", ordem: 4, componente: "kpi.minha_comissao", span: 1 },
  { id: "ven5", nome: "Pipeline por etapa", cargoId: "vendedor", ordem: 5, componente: "chart.pipeline_etapa", span: 2 },
  { id: "ven6", nome: "Vendas por mês", cargoId: "vendedor", ordem: 6, componente: "chart.vendas_mes", span: 2 },

  // Projetista
  { id: "prj1", nome: "Projetos pendentes", cargoId: "projetista", ordem: 1, componente: "kpi.projetos_pendentes", span: 1 },
  { id: "prj2", nome: "Projetos em andamento", cargoId: "projetista", ordem: 2, componente: "kpi.projetos_andamento", span: 1 },
  { id: "prj3", nome: "Vistorias agendadas", cargoId: "projetista", ordem: 3, componente: "kpi.vistorias_agendadas", span: 1 },
  { id: "prj4", nome: "Homologações", cargoId: "projetista", ordem: 4, componente: "kpi.homologacoes", span: 1 },
  { id: "prj5", nome: "Projetos por etapa", cargoId: "projetista", ordem: 5, componente: "chart.pipeline_engenharia", span: 2 },
  { id: "prj6", nome: "Pipeline de instalação", cargoId: "projetista", ordem: 6, componente: "chart.leads_por_etapa", span: 2 },

  // Financeiro
  { id: "fin1", nome: "Receita total", cargoId: "financeiro", ordem: 1, componente: "kpi.receita_total", span: 1 },
  { id: "fin2", nome: "Ticket médio", cargoId: "financeiro", ordem: 2, componente: "kpi.ticket_medio", span: 1 },
  { id: "fin3", nome: "Aguardando financiamento", cargoId: "financeiro", ordem: 3, componente: "kpi.financiamento_pendente", span: 1 },
  { id: "fin4", nome: "Meta do mês", cargoId: "financeiro", ordem: 4, componente: "kpi.meta_mes", span: 1 },
  { id: "fin5", nome: "Receita por mês", cargoId: "financeiro", ordem: 5, componente: "chart.vendas_mes", span: 2 },
  { id: "fin6", nome: "Valor por funil", cargoId: "financeiro", ordem: 6, componente: "chart.funis", span: 2 },

  // Instalação
  { id: "ins1", nome: "Instalações agendadas", cargoId: "instalacao", ordem: 1, componente: "kpi.instalacoes_hoje", span: 1 },
  { id: "ins2", nome: "Comissionamento", cargoId: "instalacao", ordem: 2, componente: "kpi.comissionamento", span: 1 },
  { id: "ins3", nome: "Concluídas", cargoId: "instalacao", ordem: 3, componente: "kpi.concluidas", span: 1 },
  { id: "ins4", nome: "Vistorias agendadas", cargoId: "instalacao", ordem: 4, componente: "kpi.vistorias_agendadas", span: 1 },
  { id: "ins5", nome: "Pipeline de instalação", cargoId: "instalacao", ordem: 5, componente: "chart.leads_por_etapa", span: 2 },

  // Pós-venda
  { id: "pos1", nome: "Acompanhamentos ativos", cargoId: "pos_venda", ordem: 1, componente: "kpi.acompanhamentos_ativos", span: 1 },
  { id: "pos2", nome: "NPS pendentes", cargoId: "pos_venda", ordem: 2, componente: "kpi.nps_pendentes", span: 1 },
  { id: "pos3", nome: "Ampliações", cargoId: "pos_venda", ordem: 3, componente: "kpi.ampliacoes", span: 1 },
  { id: "pos4", nome: "Gestão energética", cargoId: "pos_venda", ordem: 4, componente: "kpi.gestao_energetica", span: 1 },
  { id: "pos5", nome: "Negócios por funil de pós-venda", cargoId: "pos_venda", ordem: 5, componente: "chart.pos_venda_funis", span: 2 },
];
