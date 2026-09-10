import {
  addDoc,
  collection,
  deleteDoc,
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
import { Deal } from "@/lib/types";

const COLLECTION = "deals";

export async function fetchDeals(): Promise<Deal[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Deal, "id">) }));
}

export async function fetchDeal(id: string): Promise<Deal | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Deal, "id">) } : null;
}

export async function createDeal(dados: Omit<Deal, "id" | "createdAt">): Promise<Deal> {
  const createdAt = new Date().toISOString().slice(0, 10);
  const payload = stripUndefined({ ...dados, createdAt, _createdAt: serverTimestamp() });
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return { id: ref.id, ...dados, createdAt };
}

export async function updateDealDoc(id: string, patch: Partial<Deal>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined(patch));
}

export async function deleteDeal(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Duplica um negócio: copia os campos principais (não leva anotações/atividades). */
export async function duplicateDeal(original: Deal): Promise<Deal> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, status, motivoPerda, fechadoEm, ...rest } = original;
  return createDeal({ ...rest, titulo: `${original.titulo} (cópia)`, status: "aberto" });
}
