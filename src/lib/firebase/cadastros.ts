import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./config";
import { stripUndefined } from "./utils";
import { Organizacao, Pessoa } from "@/lib/types";

/**
 * Organizações e Pessoas criadas pelo Funil (coleções `organizacoes` e `pessoas`).
 * O id é gerado no modal e usado como id do documento, assim os negócios que
 * guardam `organizacaoId` / `pessoaId` continuam apontando pro lugar certo
 * depois de recarregar a página.
 */

export async function fetchOrganizacoes(): Promise<Organizacao[]> {
  const snap = await getDocs(collection(db, "organizacoes"));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Organizacao, "id">), id: d.id }));
}

export async function fetchPessoas(): Promise<Pessoa[]> {
  const snap = await getDocs(collection(db, "pessoas"));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Pessoa, "id">), id: d.id }));
}

export async function saveOrganizacao(org: Organizacao): Promise<void> {
  const { id, ...dados } = org;
  await setDoc(doc(db, "organizacoes", id), stripUndefined(dados));
}

export async function savePessoa(pessoa: Pessoa): Promise<void> {
  const { id, ...dados } = pessoa;
  await setDoc(doc(db, "pessoas", id), stripUndefined(dados));
}
