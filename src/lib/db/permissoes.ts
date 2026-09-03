import { CargoId, CargoPermissao, Permissao } from "@/lib/types";

export const PERMISSOES: Permissao[] = [
  { id: "menu.dashboard", nome: "Ver Dashboard" },
  { id: "menu.leads", nome: "Ver Leads" },
  { id: "menu.clientes", nome: "Ver Clientes" },
  { id: "menu.funil", nome: "Ver Funil" },
  { id: "menu.instalacoes", nome: "Ver Instalações" },
  { id: "menu.usuarios", nome: "Ver Usuários" },
  { id: "funil.comercial", nome: "Ver funil Comercial" },
  { id: "funil.engenharia", nome: "Ver funil Engenharia" },
  { id: "funil.pos_acompanhamento", nome: "Ver funil Pós-venda: Acompanhamento" },
  { id: "funil.pos_nps", nome: "Ver funil Pós-venda: NPS" },
  { id: "funil.pos_gestao_energetica", nome: "Ver funil Pós-venda: Gestão energética" },
  { id: "funil.pos_ampliacao", nome: "Ver funil Pós-venda: Ampliação" },
];

const ALL_FUNIS = [
  "funil.comercial",
  "funil.engenharia",
  "funil.pos_acompanhamento",
  "funil.pos_nps",
  "funil.pos_gestao_energetica",
  "funil.pos_ampliacao",
];

const POS_VENDA_FUNIS = [
  "funil.pos_acompanhamento",
  "funil.pos_nps",
  "funil.pos_gestao_energetica",
  "funil.pos_ampliacao",
];

function linhas(cargoId: CargoId, permissaoIds: string[]): CargoPermissao[] {
  return permissaoIds.map((permissaoId) => ({ cargoId, permissaoId }));
}

export const CARGO_PERMISSOES: CargoPermissao[] = [
  ...linhas("admin", ["menu.dashboard", "menu.leads", "menu.clientes", "menu.funil", "menu.instalacoes", "menu.usuarios", ...ALL_FUNIS]),
  ...linhas("vendedor", ["menu.dashboard", "menu.leads", "menu.clientes", "menu.funil", "funil.comercial"]),
  ...linhas("projetista", ["menu.dashboard", "menu.clientes", "menu.funil", "menu.instalacoes", "funil.engenharia"]),
  ...linhas("financeiro", ["menu.dashboard", "menu.clientes"]),
  ...linhas("instalacao", ["menu.dashboard", "menu.clientes", "menu.instalacoes"]),
  ...linhas("pos_venda", ["menu.dashboard", "menu.clientes", "menu.funil", ...POS_VENDA_FUNIS]),
];

/** Confere se um cargo tem determinada permissão — nunca faz `if (cargo === "x")` no resto do app. */
export function hasPermission(cargoId: CargoId, permissaoId: string): boolean {
  return CARGO_PERMISSOES.some((cp) => cp.cargoId === cargoId && cp.permissaoId === permissaoId);
}

export function permissoesDoCargo(cargoId: CargoId): string[] {
  return CARGO_PERMISSOES.filter((cp) => cp.cargoId === cargoId).map((cp) => cp.permissaoId);
}
