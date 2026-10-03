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

/**
 * Copia os documentos/fotos de um negócio para outro (usado quando o card passa de funil).
 * Copia do mais antigo pro mais novo, pra manter a mesma ordem na lista. Um arquivo que
 * falhar não impede os outros: devolve quantos foram copiados e os nomes dos que falharam.
 */
export async function copiarDocumentos(
  origemId: string,
  destinoId: string,
  docs?: DocumentoAnexo[]
): Promise<{ copiados: number; falhas: string[] }> {
  const lista = docs ?? (await fetchDocumentos(origemId));
  const falhas: string[] = [];
  let copiados = 0;
  for (const d of [...lista].reverse()) {
    if (!d.previewUrl) continue;
    try {
      await addDocumento(destinoId, {
        tipo: d.tipo,
        nome: d.nome,
        tamanho: d.tamanho,
        previewUrl: d.previewUrl,
      });
      copiados++;
    } catch (err) {
      console.error(`Erro ao copiar o documento ${d.nome}:`, err);
      falhas.push(d.nome);
    }
  }
  return { copiados, falhas };
}
