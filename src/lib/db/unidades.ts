import { Usuario } from "@/lib/types";

/**
 * "Unidades" (franquias/filiais) do CRM — hoje é uma tabela fixa em memória,
 * simulando o mesmo padrão de src/lib/db/cargos.ts e src/lib/db/permissoes.ts.
 * Quando existir mais de uma unidade operando de verdade, isso migra pra uma
 * coleção `unidades` no Firestore (igual foi feito com `usuarios`).
 */
export type Unidade = { id: string; nome: string };

export const UNIDADES: Unidade[] = [{ id: "ydea-energia-solar", nome: "Ydea Energia Solar" }];

export const UNIDADE_PADRAO_ID = UNIDADES[0].id;

export function unidadeDoUsuario(user: Pick<Usuario, "unidadeId">): Unidade {
  return UNIDADES.find((u) => u.id === user.unidadeId) ?? UNIDADES[0];
}
