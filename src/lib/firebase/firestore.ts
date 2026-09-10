import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./config";
import { CargoId } from "@/lib/types";
import { stripUndefined } from "./utils";

/**
 * Documento da coleção `usuarios` no Firestore.
 * Cada documento tem como ID o UID do Firebase Auth do usuário —
 * é isso que liga "quem logou" a "quem essa pessoa é dentro do CRM".
 * As contas são criadas exclusivamente pelo painel de Admin (ver
 * src/app/api/admin/usuarios/route.ts), que cria as duas coisas juntas:
 * o login no Firebase Auth e este documento.
 */
export type UsuarioDoc = {
  nome: string;
  email: string;
  iniciais: string;
  cargoId: CargoId;
  sobrenome?: string;
  telefone?: string;
  fotoUrl?: string;
  unidadeId?: string;
};

export async function fetchUsuario(uid: string): Promise<UsuarioDoc | null> {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? (snap.data() as UsuarioDoc) : null;
}

export async function fetchAllUsuarios(): Promise<(UsuarioDoc & { id: string })[]> {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as UsuarioDoc) }));
}

/** Admin muda o cargo de alguém. */
export async function atualizarCargoUsuario(usuarioId: string, cargoId: CargoId): Promise<void> {
  await updateDoc(doc(db, "usuarios", usuarioId), { cargoId });
}

/** Campos que o próprio usuário pode editar no "Configurações de perfil". */
export type PerfilEditavel = Partial<Pick<UsuarioDoc, "nome" | "sobrenome" | "telefone" | "fotoUrl">>;

/** Usuário edita os próprios dados (nome, sobrenome, telefone, foto) — cargo fica de fora, só admin mexe. */
export async function atualizarPerfilUsuario(usuarioId: string, patch: PerfilEditavel): Promise<void> {
  await updateDoc(doc(db, "usuarios", usuarioId), stripUndefined(patch));
}
