import { addDoc, collection, doc, onSnapshot, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./config";

/** Notificação que aparece no sino da pessoa marcada (coleção `notificacoes`). */
export type Notificacao = {
  id: string;
  /** UID de quem recebe a notificação. */
  usuarioId: string;
  tipo: "mencao" | "novo_negocio";
  dealId: string;
  dealTitulo: string;
  /** Só nas menções. */
  anotacaoId?: string;
  /** Quem marcou (menção) ou quem passou o card (novo negócio). */
  deId: string;
  deNome: string;
  trecho: string;
  criadoEm: string; // ISO datetime
  lida: boolean;
};

const COLLECTION = "notificacoes";

/** Avisa quem tem a função da etapa que chegou um card novo (ex.: Engenharia). */
export async function criarNotificacoesNovoNegocio(dados: {
  destinatarios: string[];
  dealId: string;
  dealTitulo: string;
  autorId: string;
  autorNome: string;
  /** Ex.: "Engenharia · Onboard". */
  destino: string;
}): Promise<void> {
  const criadoEm = new Date().toISOString();
  await Promise.all(
    dados.destinatarios.map((usuarioId) =>
      addDoc(collection(db, COLLECTION), {
        usuarioId,
        tipo: "novo_negocio",
        dealId: dados.dealId,
        dealTitulo: dados.dealTitulo,
        deId: dados.autorId,
        deNome: dados.autorNome,
        trecho: dados.destino,
        criadoEm,
        lida: false,
      })
    )
  );
}

export async function criarNotificacoesMencao(dados: {
  destinatarios: string[];
  dealId: string;
  dealTitulo: string;
  anotacaoId: string;
  autorId: string;
  autorNome: string;
  texto: string;
}): Promise<void> {
  const criadoEm = new Date().toISOString();
  const trecho = dados.texto.length > 140 ? dados.texto.slice(0, 140) + "…" : dados.texto;
  await Promise.all(
    dados.destinatarios.map((usuarioId) =>
      addDoc(collection(db, COLLECTION), {
        usuarioId,
        tipo: "mencao",
        dealId: dados.dealId,
        dealTitulo: dados.dealTitulo,
        anotacaoId: dados.anotacaoId,
        deId: dados.autorId,
        deNome: dados.autorNome,
        trecho,
        criadoEm,
        lida: false,
      })
    )
  );
}

/**
 * Escuta em tempo real as notificações da pessoa logada. Filtra só por usuarioId
 * (sem orderBy) pra não exigir índice composto; a ordenação é feita aqui.
 * Devolve a função pra parar de escutar.
 */
export function ouvirNotificacoes(
  usuarioId: string,
  onChange: (itens: Notificacao[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, COLLECTION), where("usuarioId", "==", usuarioId));
  return onSnapshot(
    q,
    (snap) => {
      const itens = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Notificacao, "id">) }))
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
        .slice(0, 30);
      onChange(itens);
    },
    onError
  );
}

export async function marcarComoLida(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { lida: true });
}

export async function marcarTodasComoLidas(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const batch = writeBatch(db);
  ids.forEach((id) => batch.update(doc(db, COLLECTION, id), { lida: true }));
  await batch.commit();
}
