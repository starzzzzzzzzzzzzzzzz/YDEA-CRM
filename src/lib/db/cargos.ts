import { Cargo } from "@/lib/types";

export const CARGOS: Cargo[] = [
  { id: "admin", nome: "Administrador", descricao: "Acesso total ao sistema" },
  { id: "vendedor", nome: "Vendedor", descricao: "Time comercial — leads, funil de vendas e propostas" },
  { id: "projetista", nome: "Projetista", descricao: "Engenharia — projetos, ART e homologação" },
  { id: "financeiro", nome: "Financeiro", descricao: "Contas, recebíveis e faturamento" },
  { id: "instalacao", nome: "Instalação", descricao: "Equipe de campo — instalações e comissionamento" },
  { id: "pos_venda", nome: "Pós-venda", descricao: "Acompanhamento, garantias e relacionamento" },
];
