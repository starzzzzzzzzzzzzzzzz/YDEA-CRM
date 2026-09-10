import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./config";
import { stripUndefined } from "./utils";
import { Cliente } from "@/lib/types";

const COLLECTION = "clientes";

/** Busca todos os clientes, mais recentes primeiro. */
export async function fetchClientes(): Promise<Cliente[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Cliente, "id">) }));
}

export async function fetchCliente(id: string): Promise<Cliente | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Cliente, "id">) } : null;
}

/** Gera o próximo código sequencial (CLI-0001, CLI-0002...) contando os clientes existentes. */
async function nextCodigo(): Promise<string> {
  const snap = await getDocs(collection(db, COLLECTION));
  return `CLI-${String(snap.size + 1).padStart(4, "0")}`;
}

/** Cria um cliente novo no Firestore. `id` e `codigo` são gerados aqui. */
export async function createCliente(dados: Omit<Cliente, "id" | "codigo" | "createdAt">): Promise<Cliente> {
  const codigo = await nextCodigo();
  const createdAt = new Date().toISOString().slice(0, 10);
  const payload = stripUndefined({ ...dados, codigo, createdAt, _createdAt: serverTimestamp() });
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return { id: ref.id, ...dados, codigo, createdAt };
}

export async function updateCliente(id: string, patch: Partial<Cliente>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined(patch));
}
