"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Atividade } from "@/lib/types";
import { useAuth } from "@/lib/store/AuthContext";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { fetchPendentesDosNegocios, marcarAtividadeConcluida } from "@/lib/firebase/atividades";
import { criarLembreteUmaVez } from "@/lib/firebase/notificacoes";
import { AtividadeDoNegocio, ehDoUsuario, ehParaHoje, estaAtrasada, dataLocalISO } from "@/lib/atividades";

type AtividadesContextValue = {
  /** Atividades PENDENTES dos negócios abertos. */
  itens: AtividadeDoNegocio[];
  carregando: boolean;
  /** Usado pelo painel do negócio: troca as pendentes daquele negócio pelas da lista dele. */
  substituirDoNegocio: (dealId: string, todas: Atividade[]) => void;
  marcarConcluida: (dealId: string, atividadeId: string) => Promise<void>;
  recarregar: () => Promise<void>;
};

const AtividadesContext = createContext<AtividadesContextValue | null>(null);

const RECARREGAR_APOS_MS = 10 * 60 * 1000;

export function AtividadesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { deals, dealsLoading } = useCrmData();
  const [itens, setItens] = useState<AtividadeDoNegocio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const carregouRef = useRef(false);
  const ultimaCargaRef = useRef(0);
  const dealsRef = useRef(deals);
  useEffect(() => {
    dealsRef.current = deals;
  }, [deals]);

  const recarregar = useCallback(async () => {
    const ids = dealsRef.current.filter((d) => d.status === "aberto").map((d) => d.id);
    try {
      setItens(await fetchPendentesDosNegocios(ids));
      ultimaCargaRef.current = Date.now();
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Primeira carga: assim que a lista de negócios chega.
  useEffect(() => {
    if (dealsLoading || carregouRef.current) return;
    carregouRef.current = true;
    recarregar();
  }, [dealsLoading, recarregar]);

  // Volta pra aba depois de um tempo: atualiza (outra pessoa pode ter criado atividade).
  useEffect(() => {
    function aoVoltar() {
      if (document.visibilityState === "visible" && Date.now() - ultimaCargaRef.current > RECARREGAR_APOS_MS) {
        recarregar();
      }
    }
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [recarregar]);

  const substituirDoNegocio = useCallback((dealId: string, todas: Atividade[]) => {
    setItens((prev) => [
      ...prev.filter((i) => i.dealId !== dealId),
      ...todas.filter((a) => !a.concluida).map((atividade) => ({ dealId, atividade })),
    ]);
  }, []);

  const marcarConcluida = useCallback(
    async (dealId: string, atividadeId: string) => {
      setItens((prev) => prev.filter((i) => !(i.dealId === dealId && i.atividade.id === atividadeId)));
      try {
        await marcarAtividadeConcluida(dealId, atividadeId, true);
      } catch (err) {
        console.error("Erro ao concluir atividade:", err);
        await recarregar();
        throw err;
      }
    },
    [recarregar]
  );

  // Lembretes no sino: confere a cada minuto (com o CRM aberto) e grava UMA notificação por
  // atividade atrasada e UM resumo por dia. O id da notificação é fixo, então nunca duplica,
  // nem com o CRM aberto em dois lugares.
  const jaTratadas = useRef(new Set<string>());
  useEffect(() => {
    if (!user || carregando) return;

    function checar() {
      if (!user) return;
      const agora = new Date();
      const minhas = itens.filter((i) => ehDoUsuario(i.atividade, user));

      for (const { dealId, atividade } of minhas) {
        if (!estaAtrasada(atividade, agora)) continue;
        const id = `lembrete-atrasada-${atividade.id}`;
        if (jaTratadas.current.has(id)) continue;
        jaTratadas.current.add(id);
        const deal = dealsRef.current.find((d) => d.id === dealId);
        criarLembreteUmaVez(id, {
          usuarioId: user.id,
          tipo: "atividade_atrasada",
          dealId,
          dealTitulo: deal?.titulo ?? "Negócio",
          deId: "",
          deNome: "",
          trecho: atividade.titulo,
        }).catch((err) => console.error("Erro ao criar lembrete:", err));
      }

      const paraHoje = minhas.filter((i) => ehParaHoje(i.atividade, agora)).length;
      const idHoje = `lembrete-hoje-${user.id}-${dataLocalISO(agora)}`;
      if (paraHoje > 0 && !jaTratadas.current.has(idHoje)) {
        jaTratadas.current.add(idHoje);
        criarLembreteUmaVez(idHoje, {
          usuarioId: user.id,
          tipo: "atividade_hoje",
          dealId: "",
          dealTitulo: "",
          deId: "",
          deNome: "",
          trecho: paraHoje === 1 ? "Você tem 1 atividade para hoje" : `Você tem ${paraHoje} atividades para hoje`,
        }).catch((err) => console.error("Erro ao criar lembrete:", err));
      }
    }

    checar();
    const timer = setInterval(checar, 60_000);
    return () => clearInterval(timer);
  }, [itens, carregando, user]);

  const value = useMemo(
    () => ({ itens, carregando, substituirDoNegocio, marcarConcluida, recarregar }),
    [itens, carregando, substituirDoNegocio, marcarConcluida, recarregar]
  );
  return <AtividadesContext.Provider value={value}>{children}</AtividadesContext.Provider>;
}

export function useAtividades() {
  const ctx = useContext(AtividadesContext);
  if (!ctx) throw new Error("useAtividades must be used within AtividadesProvider");
  return ctx;
}
