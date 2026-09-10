import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
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
