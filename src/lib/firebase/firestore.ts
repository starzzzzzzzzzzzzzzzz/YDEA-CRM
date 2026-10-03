import { collection, deleteField, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./config";
import { CargoId, FuncaoId } from "@/lib/types";
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
  funcao?: FuncaoId;
  sobrenome?: string;
  telefone?: string;
  fotoUrl?: string;
  unidadeId?: string;
};

export async function fetchUsuario(uid: string): Promise<UsuarioDoc | null> {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return null;

  const data = snap.data() as UsuarioDoc;
  return {
    ...data,
    sobrenome: data.sobrenome ?? "",
    telefone: data.telefone ?? "",
    fotoUrl: data.fotoUrl ?? "",
    unidadeId: data.unidadeId ?? "",
  };
}

export async function fetchAllUsuarios(): Promise<(UsuarioDoc & { id: string })[]> {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs.map((d) => {
    const data = d.data() as UsuarioDoc;
    return {
      id: d.id,
      ...data,
      sobrenome: data.sobrenome ?? "",
      telefone: data.telefone ?? "",
      fotoUrl: data.fotoUrl ?? "",
      unidadeId: data.unidadeId ?? "",
    };
  });
}

/** Admin muda o cargo de alguém. */
export async function atualizarCargoUsuario(usuarioId: string, cargoId: CargoId): Promise<void> {
  await updateDoc(doc(db, "usuarios", usuarioId), stripUndefined({ cargoId }));
}

/** Muda a função na equipe de alguém (vazio = sem função). */
export async function atualizarFuncaoUsuario(usuarioId: string, funcao: FuncaoId | ""): Promise<void> {
  await updateDoc(doc(db, "usuarios", usuarioId), { funcao: funcao || deleteField() });
}

/** Campos que o próprio usuário pode editar no "Configurações de perfil". */
export type PerfilEditavel = Partial<Pick<UsuarioDoc, "nome" | "sobrenome" | "telefone" | "fotoUrl">>;

/** Usuário edita os próprios dados (nome, sobrenome, telefone, foto) — cargo fica de fora, só admin mexe. */
export async function atualizarPerfilUsuario(usuarioId: string, patch: PerfilEditavel): Promise<void> {
  const payloadSeguro = stripUndefined(patch);

  // Evita fazer a requisição se nenhum campo válido foi alterado
  if (Object.keys(payloadSeguro).length === 0) return;

  await updateDoc(doc(db, "usuarios", usuarioId), payloadSeguro);
}