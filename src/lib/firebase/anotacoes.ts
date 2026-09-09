import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./config";
import { Anotacao } from "@/lib/types";

function anotacoesRef(dealId: string) {
  return collection(db, "deals", dealId, "anotacoes");
}

export async function fetchAnotacoes(dealId: string): Promise<Anotacao[]> {
  const q = query(anotacoesRef(dealId), orderBy("criadoEm", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Anotacao, "id">) }));
}

export async function addAnotacao(
  dealId: string,
  dados: Omit<Anotacao, "id" | "criadoEm">
): Promise<Anotacao> {
  const criadoEm = new Date().toISOString();
  const ref = await addDoc(anotacoesRef(dealId), { ...dados, criadoEm });
  return { id: ref.id, ...dados, criadoEm };
}
