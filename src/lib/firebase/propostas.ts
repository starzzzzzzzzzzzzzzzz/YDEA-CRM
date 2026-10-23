import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./config";
import type { PropostaDados, PropostaSalva, PropostaStatus } from "@/lib/propostas/types";

const COLLECTION = "propostas";

/**
 * O Firestore recusa `undefined` em qualquer nível. Os dados da proposta têm objetos
 * aninhados com campos opcionais (módulo, inversores), então o stripUndefined de um
 * nível só não basta — o round-trip por JSON remove todos os `undefined`.
 */
function limpar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

/** Próximo número sequencial, reservado numa transação (dois usuários nunca pegam o mesmo). */
async function proximoNumero(): Promise<number> {
  const ref = doc(db, "contadores", "propostas");
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const proximo = ((snap.exists() ? (snap.data().ultimo as number) : 0) ?? 0) + 1;
    tx.set(ref, { ultimo: proximo });
    return proximo;
  });
}

export async function fetchPropostas(dealId?: string): Promise<PropostaSalva[]> {
  const base = collection(db, COLLECTION);
  const q = dealId ? query(base, where("dealId", "==", dealId)) : query(base, orderBy("criadoEm", "desc"));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ ...(d.data() as Omit<PropostaSalva, "id">), id: d.id }));
  // Com filtro por negócio ordenamos aqui, para não exigir índice composto no Firestore.
  return rows.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function fetchProposta(id: string): Promise<PropostaSalva | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { ...(snap.data() as Omit<PropostaSalva, "id">), id: snap.id } : null;
}

export async function createProposta(args: {
  dados: PropostaDados;
  valorTotal: number;
  potenciaKwp: number;
  status: PropostaStatus;
  usuarioId: string;
  usuarioNome: string;
}): Promise<PropostaSalva> {
  const numero = await proximoNumero();
  const agora = new Date().toISOString();
  const payload: Omit<PropostaSalva, "id"> = limpar({
    numero,
    status: args.status,
    dealId: args.dados.dealId,
    clienteNome: args.dados.clienteNome,
    nomeProjeto: args.dados.nomeProjeto,
    valorTotal: args.valorTotal,
    potenciaKwp: args.potenciaKwp,
    criadoEm: agora,
    atualizadoEm: agora,
    criadoPorId: args.usuarioId,
    criadoPorNome: args.usuarioNome,
    dados: args.dados,
  });
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return { ...payload, id: ref.id };
}

export async function updateProposta(
  id: string,
  patch: { dados?: PropostaDados; valorTotal?: number; potenciaKwp?: number; status?: PropostaStatus }
): Promise<void> {
  const dados = patch.dados;
  await updateDoc(
    doc(db, COLLECTION, id),
    limpar({
      ...patch,
      ...(dados ? { dealId: dados.dealId, clienteNome: dados.clienteNome, nomeProjeto: dados.nomeProjeto } : {}),
      atualizadoEm: new Date().toISOString(),
    })
  );
}
