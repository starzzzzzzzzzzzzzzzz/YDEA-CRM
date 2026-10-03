import { FuncaoId } from "@/lib/types";

export const FUNCOES: { id: FuncaoId; nome: string; descricao: string }[] = [
  { id: "comercial", nome: "Comercial / Vendedor", descricao: "Funil Comercial: vendas, propostas e negociação" },
  { id: "engenharia", nome: "Engenharia / Projetista", descricao: "Funil Engenharia: projetos, ART e homologação" },
  { id: "instalacao", nome: "Instalação", descricao: "Equipe de campo" },
  { id: "pos_venda", nome: "Pós-venda", descricao: "Funis Pós-Acompanhamento e Pós-NPS" },
  { id: "financeiro", nome: "Financeiro", descricao: "Contas e faturamento" },
];

export const FUNCOES_VALIDAS: FuncaoId[] = FUNCOES.map((f) => f.id);
