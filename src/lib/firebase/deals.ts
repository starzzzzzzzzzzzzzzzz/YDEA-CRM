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
import { Deal, DocumentoAnexo } from "@/lib/types";
import { addDocumento } from "./documentos";

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

/**
 * Cria o negócio em 2 etapas:
 * 1. grava o negócio SEM os anexos (evita estourar o limite de 1MB do documento);
 * 2. com o id novo, grava cada anexo na subcoleção deals/{id}/documentos —
 *    o mesmo caminho que a aba "Documentos e fotos" do negócio já usa.
 * Se algum anexo falhar, o negócio continua criado e o erro é lançado em
 * `AnexosFalharam` para a tela avisar o usuário.
 */
export class AnexosFalharam extends Error {
  deal: Deal;
  falhas: string[];
  constructor(deal: Deal, falhas: string[]) {
    super(`Negócio criado, mas ${falhas.length} anexo(s) não foram salvos: ${falhas.join(", ")}`);
    this.name = "AnexosFalharam";
    this.deal = deal;
    this.falhas = falhas;
  }
}

export async function createDeal(dados: Omit<Deal, "id" | "createdAt">): Promise<Deal> {
  const createdAt = new Date().toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { documentos, ...dadosSemAnexos } = dados;

  const agora = new Date().toISOString();
  const historicoEtapas = dadosSemAnexos.historicoEtapas ?? [
    { stageId: dadosSemAnexos.stageId, em: agora },
  ];

  const payload = stripUndefined({
    ...dadosSemAnexos,
    historicoEtapas,
    createdAt,
    _createdAt: serverTimestamp(),
  });

  const ref = await addDoc(collection(db, COLLECTION), payload);
  const criado: Deal = { id: ref.id, ...dadosSemAnexos, historicoEtapas, createdAt };

  if (documentos?.length) {
    const salvos: DocumentoAnexo[] = [];
    const falhas: string[] = [];
    for (const d of documentos) {
      if (!d.previewUrl) continue;
      try {
        salvos.push(
          await addDocumento(ref.id, {
            tipo: d.tipo,
            nome: d.nome,
            tamanho: d.tamanho,
            previewUrl: d.previewUrl,
          })
        );
      } catch (err) {
        console.error(`Erro ao salvar anexo ${d.nome}:`, err);
        falhas.push(d.nome);
      }
    }
    criado.documentos = salvos;
    if (falhas.length) throw new AnexosFalharam(criado, falhas);
  }

  return criado;
}

export async function updateDealDoc(id: string, patch: Partial<Deal>): Promise<void> {
  // Anexos vivem na subcoleção deals/{id}/documentos — nunca no documento principal.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { documentos, ...resto } = patch;
  await updateDoc(doc(db, COLLECTION, id), stripUndefined(resto));
}

export async function deleteDeal(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Duplica um negócio: copia os campos principais (não leva anotações/atividades). */
export async function duplicateDeal(original: Deal): Promise<Deal> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    id,
    createdAt,
    status,
    motivoPerda,
    fechadoEm,
    documentos,
    negocioOrigemId,
    negocioSeguinteId,
    historicoEtapas,
    ...rest
  } = original;
  return createDeal({ ...rest, titulo: `${original.titulo} (cópia)`, status: "aberto" });
}