import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./config";
import { DocumentoAnexo, DocumentoTipo } from "@/lib/types";

/**
 * Sobe um arquivo (documento ou foto) pro Storage, dentro de deals/{dealId}/,
 * e devolve o DocumentoAnexo pronto pra salvar no array `documentos` do negócio no Firestore.
 */
export async function uploadDocumento(
  dealId: string,
  file: File,
  tipo: DocumentoTipo
): Promise<DocumentoAnexo> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `deals/${dealId}/${id}-${file.name}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const previewUrl = await getDownloadURL(storageRef);

  return {
    id,
    tipo,
    nome: file.name,
    tamanho: file.size,
    previewUrl,
    storagePath,
    uploadedAt: new Date().toISOString(),
  };
}

export async function deleteDocumento(storagePath: string): Promise<void> {
  await deleteObject(ref(storage, storagePath));
}

/** Sobe a foto de perfil do usuário pra usuarios/{uid}/foto-{timestamp} e devolve a URL pública. */
export async function uploadFotoPerfil(uid: string, file: File): Promise<string> {
  const storagePath = `usuarios/${uid}/foto-${Date.now()}-${file.name}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
