import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./config";
import { stripUndefined } from "./utils";
import { DocumentoAnexo, DocumentoTipo } from "@/lib/types";

function documentosRef(dealId: string) {
  return collection(db, "deals", dealId, "documentos");
}

export async function fetchDocumentos(dealId: string): Promise<DocumentoAnexo[]> {
  const q = query(documentosRef(dealId), orderBy("uploadedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentoAnexo, "id">) }));
}

/**
 * Salva um documento/foto do negócio — o arquivo já vem como data URL (ver
 * lib/fileToDataUrl.ts), guardado direto no campo `previewUrl` do documento.
 * Sem Firebase Storage: no plano Spark (gratuito), o Storage exige vincular uma
 * conta de faturamento mesmo pra uso pequeno, então evitamos essa dependência.
 */
export async function addDocumento(
  dealId: string,
  dados: { tipo: DocumentoTipo; nome: string; tamanho: number; previewUrl: string }
): Promise<DocumentoAnexo> {
  const uploadedAt = new Date().toISOString();
  const payload = stripUndefined({ ...dados, uploadedAt });
  const ref = await addDoc(documentosRef(dealId), payload);
  return { id: ref.id, ...dados, uploadedAt };
}

export async function removeDocumento(dealId: string, documentoId: string): Promise<void> {
  await deleteDoc(doc(db, "deals", dealId, "documentos", documentoId));
}
