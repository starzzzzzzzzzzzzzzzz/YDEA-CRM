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

  // 1. Tratamento e sanitização profunda para documentos/fotos anexados
  const dadosSanitizados = { ...dados };

  if (Array.isArray((dadosSanitizados as any).documentos)) {
    (dadosSanitizados as any).documentos = (dadosSanitizados as any).documentos.map((docAnexo: any) =>
      stripUndefined({
        nome: docAnexo.nome ?? "",
        url: docAnexo.url ?? null,
        tipo: docAnexo.tipo ?? null,
        tamanho: docAnexo.tamanho ?? 0,
        createdAt: docAnexo.createdAt ?? new Date().toISOString(),
      })
    );
  }

  // 2. Limpeza global do payload para o Firestore
  const payload = stripUndefined({
    ...dadosSanitizados,
    createdAt,
    _createdAt: serverTimestamp(),
  });

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return { id: ref.id, ...dados, createdAt };
}

export async function updateDealDoc(id: string, patch: Partial<Deal>): Promise<void> {
  const patchSanitizado = { ...patch };

  if (Array.isArray((patchSanitizado as any).documentos)) {
    (patchSanitizado as any).documentos = (patchSanitizado as any).documentos.map((docAnexo: any) =>
      stripUndefined({
        nome: docAnexo.nome ?? "",
        url: docAnexo.url ?? null,
        tipo: docAnexo.tipo ?? null,
        tamanho: docAnexo.tamanho ?? 0,
        createdAt: docAnexo.createdAt ?? new Date().toISOString(),
      })
    );
  }

  await updateDoc(doc(db, COLLECTION, id), stripUndefined(patchSanitizado));
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