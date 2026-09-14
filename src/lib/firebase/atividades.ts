import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "./config";
import { stripUndefined } from "./utils";
import { Atividade } from "@/lib/types";

function atividadesRef(dealId: string) {
  return collection(db, "deals", dealId, "atividades");
}

export async function fetchAtividades(dealId: string): Promise<Atividade[]> {
  const q = query(atividadesRef(dealId), orderBy("data", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Atividade, "id">) }));
}

/**
 * Verifica, para uma lista de negócios, quais têm ao menos uma atividade
 * PENDENTE (não concluída). Usado pelo indicador verde/vermelho no card do
 * Funil — verde só enquanto sobrar alguma atividade em aberto; se todas já
 * foram concluídas, o indicador some/fica vermelho.
 * Faz uma leitura por negócio (subcoleção), em paralelo — evita depender de
 * collectionGroup query (que exigiria criar um índice composto no Firestore).
 */
export async function checarAtividadesPorDeals(
  dealIds: string[]
): Promise<Record<string, boolean>> {
  const entries = await Promise.all(
    dealIds.map(async (dealId) => {
      const q = query(atividadesRef(dealId), where("concluida", "==", false));
      const snap = await getDocs(q);
      return [dealId, !snap.empty] as const;
    })
  );
  return Object.fromEntries(entries);
}

export async function addAtividade(
  dealId: string,
  dados: Omit<Atividade, "id" | "criadoEm" | "concluida">
): Promise<Atividade> {
  const criadoEm = new Date().toISOString();
  const payload = { ...dados, concluida: false, criadoEm };
  const ref = await addDoc(atividadesRef(dealId), stripUndefined(payload));
  return { id: ref.id, ...payload };
}

export async function marcarAtividadeConcluida(
  dealId: string,
  atividadeId: string,
  concluida: boolean
): Promise<void> {
  await updateDoc(doc(db, "deals", dealId, "atividades", atividadeId), { concluida });
}
