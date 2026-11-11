import { collection, deleteDoc, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./config";
import type { CatalogoInversor, CatalogoModulo } from "@/lib/propostas/types";

const COL_MODULOS = "catalogo_modulos";
const COL_INVERSORES = "catalogo_inversores";

function limpar<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Id estável por marca+modelo: cadastrar de novo o mesmo equipamento atualiza em vez de duplicar. */
export function idCatalogo(marca: string, modelo: string): string {
  return `${marca}-${modelo}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function fetchCatalogoModulos(): Promise<CatalogoModulo[]> {
  const snap = await getDocs(collection(db, COL_MODULOS));
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<CatalogoModulo, "id">), id: d.id }))
    .sort((a, b) => `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`));
}

export async function fetchCatalogoInversores(): Promise<CatalogoInversor[]> {
  const snap = await getDocs(collection(db, COL_INVERSORES));
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<CatalogoInversor, "id">), id: d.id }))
    .sort((a, b) => `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`));
}

export async function salvarModuloCatalogo(item: Omit<CatalogoModulo, "id">): Promise<CatalogoModulo> {
  const id = idCatalogo(item.marca, item.modelo);
  await setDoc(doc(db, COL_MODULOS, id), limpar(item));
  return { ...item, id };
}

export async function salvarInversorCatalogo(item: Omit<CatalogoInversor, "id">): Promise<CatalogoInversor> {
  const id = idCatalogo(item.marca, item.modelo);
  await setDoc(doc(db, COL_INVERSORES, id), limpar(item));
  return { ...item, id };
}

export async function excluirModuloCatalogo(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_MODULOS, id));
}

export async function excluirInversorCatalogo(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_INVERSORES, id));
}

/** Grava vários de uma vez (lotes de 400, abaixo do limite de 500 do Firestore). */
async function gravarEmLotes(colecao: string, itens: ({ marca: string; modelo: string } & Record<string, unknown>)[]): Promise<void> {
  for (let i = 0; i < itens.length; i += 400) {
    const lote = writeBatch(db);
    for (const item of itens.slice(i, i + 400)) lote.set(doc(db, colecao, idCatalogo(item.marca, item.modelo)), limpar(item));
    await lote.commit();
  }
}

export const importarModulosCatalogo = (itens: Omit<CatalogoModulo, "id">[]) => gravarEmLotes(COL_MODULOS, itens);
export const importarInversoresCatalogo = (itens: Omit<CatalogoInversor, "id">[]) => gravarEmLotes(COL_INVERSORES, itens);
