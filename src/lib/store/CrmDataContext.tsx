"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Cliente,
  ClienteStatus,
  Deal,
  Lead,
  Organizacao,
  Pessoa,
  Temperatura,
  Usuario,
} from "@/lib/types";
import { FUNNELS, PROXIMOS_APOS_GANHO, tituloComPrefixo } from "@/lib/funnels";
import { fetchDocumentos, copiarDocumentos } from "@/lib/firebase/documentos";
import { fetchAllUsuarios } from "@/lib/firebase/firestore";
import { criarNotificacoesNovoNegocio } from "@/lib/firebase/notificacoes";
import { MOCK_ORGANIZACOES } from "@/lib/mock-organizacoes";
import { MOCK_PESSOAS } from "@/lib/mock-pessoas";
import { MOCK_LEADS } from "@/lib/mock-leads";
import { fetchClientes, createCliente } from "@/lib/firebase/clientes";
import {
  fetchOrganizacoes,
  fetchPessoas,
  saveOrganizacao,
  savePessoa,
} from "@/lib/firebase/cadastros";
import {
  fetchDeals,
  createDeal,
  AnexosFalharam,
  updateDealDoc,
  deleteDeal as deleteDealDoc,
  duplicateDeal as duplicateDealDoc,
} from "@/lib/firebase/deals";

export type ResultadoCadeia = {
  criados: { deal: Deal; funilNome: string; etapaNome: string }[];
  /** Destinos que não conseguimos criar (falha ao gravar). */
  destinosComErro: number;
  documentosCopiados: number;
  documentosComErro: number;
  pessoasAvisadas: number;
  avisoFalhou: boolean;
};

type CrmDataContextValue = {
  organizacoes: Organizacao[];
  pessoas: Pessoa[];
  clientes: Cliente[];
  /** true enquanto a lista de clientes ainda está sendo carregada do Firestore. */
  clientesLoading: boolean;
  deals: Deal[];
  /** true enquanto a lista de negócios ainda está sendo carregada do Firestore. */
  dealsLoading: boolean;
  leads: Lead[];
  /** Usuário real, autenticado via Firebase Auth + Firestore (ver AuthContext). */
  currentUser: Usuario;
  addOrganizacao: (org: Organizacao) => void;
  addPessoa: (pessoa: Pessoa) => void;
  addDeal: (deal: Omit<Deal, "id" | "createdAt">) => Promise<Deal>;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  removeDeal: (id: string) => Promise<void>;
  duplicateDeal: (deal: Deal) => Promise<Deal>;
  /**
   * Chamado quando um negócio vira Ganho: cria os cards do(s) próximo(s) funil(is) da cadeia,
   * leva os documentos junto e avisa a função responsável. Não duplica se já foi criado.
   */
  criarNegociosSeguintes: (deal: Deal) => Promise<ResultadoCadeia>;
  addLead: (lead: Omit<Lead, "id" | "stage">) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  getOrganizacao: (id?: string) => Organizacao | undefined;
  getPessoa: (id?: string) => Pessoa | undefined;
};

const CrmDataContext = createContext<CrmDataContextValue | null>(null);

export function useCrmData() {
  const ctx = useContext(CrmDataContext);
  if (!ctx) throw new Error("useCrmData must be used within CrmDataProvider");
  return ctx;
}

export function CrmDataProvider({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  /** Usuário logado — vem do AuthContext (Firebase Auth + Firestore), resolvido no layout do grupo (app). */
  currentUser: Usuario;
}) {
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>(MOCK_ORGANIZACOES);
  const [pessoas, setPessoas] = useState<Pessoa[]>(MOCK_PESSOAS);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesLoading, setClientesLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  // Leads ainda são dado fictício em memória — próxima frente a migrar pro Firestore.
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);

  // Organizações e pessoas criadas no Funil ficam no Firestore; os dados fictícios
  // continuam na lista (por último) só pra não quebrar negócios antigos que apontam pra eles.
  useEffect(() => {
    let cancelado = false;
    fetchOrganizacoes()
      .then((rows) => {
        if (cancelado) return;
        const ids = new Set(rows.map((r) => r.id));
        setOrganizacoes([...rows, ...MOCK_ORGANIZACOES.filter((m) => !ids.has(m.id))]);
      })
      .catch((err) => console.error("Erro ao carregar organizações do Firestore:", err));
    fetchPessoas()
      .then((rows) => {
        if (cancelado) return;
        const ids = new Set(rows.map((r) => r.id));
        setPessoas([...rows, ...MOCK_PESSOAS.filter((m) => !ids.has(m.id))]);
      })
      .catch((err) => console.error("Erro ao carregar pessoas do Firestore:", err));
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    fetchClientes()
      .then((rows) => {
        if (!cancelado) setClientes(rows);
      })
      .catch((err) => console.error("Erro ao carregar clientes do Firestore:", err))
      .finally(() => {
        if (!cancelado) setClientesLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    fetchDeals()
      .then((rows) => {
        if (!cancelado) setDeals(rows);
      })
      .catch((err) => console.error("Erro ao carregar negócios do Firestore:", err))
      .finally(() => {
        if (!cancelado) setDealsLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  function addOrganizacao(org: Organizacao) {
    setOrganizacoes((prev) => [org, ...prev]);
    saveOrganizacao(org).catch((err) =>
      console.error("Erro ao salvar organização no Firestore:", err)
    );
    const dados: Omit<Cliente, "id" | "codigo" | "createdAt"> = {
      tipoPessoa: org.tipo,
      nome: org.nome,
      nomeFantasia: org.nomeFantasia,
      razaoSocial: org.razaoSocial,
      cpf: org.cpf,
      cnpj: org.cnpj,
      telefone: org.telefone ?? "",
      whatsapp: org.whatsapp ?? "",
      email: org.email ?? "",
      site: org.site,
      cep: org.cep,
      endereco: org.endereco,
      numero: org.numero,
      bairro: org.bairro,
      cidade: org.cidade ?? "—",
      estado: org.estado ?? "—",
      origem: org.canalOrigem,
      canal: org.canalOrigem,
      responsavel: org.responsavel ?? "—",
      temperatura: "morno" as Temperatura,
      status: "novo" as ClienteStatus,
      tags: org.tags,
      observacoes: org.observacoes,
    };
    // Grava no Firestore de verdade; enquanto isso, mostra otimisticamente na lista.
    createCliente(dados)
      .then((cliente) => setClientes((prev) => [cliente, ...prev]))
      .catch((err) => console.error("Erro ao salvar cliente (organização) no Firestore:", err));
  }

  function addPessoa(pessoa: Pessoa) {
    setPessoas((prev) => [pessoa, ...prev]);
    savePessoa(pessoa).catch((err) => console.error("Erro ao salvar pessoa no Firestore:", err));
    const vinculada = pessoa.organizacaoId
      ? organizacoes.find((o) => o.id === pessoa.organizacaoId)
      : undefined;
    const dados: Omit<Cliente, "id" | "codigo" | "createdAt"> = {
      tipoPessoa: "PF",
      nome: pessoa.nome,
      cpf: pessoa.cpf,
      rg: pessoa.rg,
      dataNascimento: pessoa.dataNascimento,
      cargo: pessoa.cargo,
      empresa: vinculada?.nome,
      telefone: pessoa.telefone ?? "",
      whatsapp: pessoa.whatsapp ?? "",
      email: pessoa.email ?? "",
      cep: pessoa.cep,
      endereco: pessoa.endereco,
      numero: pessoa.numero,
      bairro: pessoa.bairro,
      cidade: pessoa.cidade ?? "—",
      estado: pessoa.estado ?? "—",
      origem: pessoa.canalOrigem,
      canal: pessoa.canalOrigem,
      responsavel: pessoa.responsavel ?? "—",
      temperatura: "morno" as Temperatura,
      status: "novo" as ClienteStatus,
      tags: [],
      observacoes: pessoa.observacoes,
    };
    createCliente(dados)
      .then((cliente) => setClientes((prev) => [cliente, ...prev]))
      .catch((err) => console.error("Erro ao salvar cliente (pessoa) no Firestore:", err));
  }

  async function addDeal(deal: Omit<Deal, "id" | "createdAt">): Promise<Deal> {
    try {
      const criado = await createDeal(deal);
      setDeals((prev) => [criado, ...prev]);
      return criado;
    } catch (err) {
      // Negócio criado, mas algum anexo falhou: ele precisa aparecer na lista mesmo assim.
      if (err instanceof AnexosFalharam) setDeals((prev) => [err.deal, ...prev]);
      throw err;
    }
  }

  function updateDeal(id: string, patch: Partial<Deal>) {
    // Mudou de etapa? Registra no histórico (base para tempo por etapa e conversão).
    const atual = deals.find((d) => d.id === id);
    let patchFinal = patch;
    if (patch.stageId && atual && patch.stageId !== atual.stageId) {
      patchFinal = {
        ...patch,
        historicoEtapas: [
          ...(atual.historicoEtapas ?? []),
          { stageId: patch.stageId, em: new Date().toISOString() },
        ],
      };
    }
    // Otimista: reflete na hora na tela (essencial pro drag-and-drop do Kanban não travar),
    // e grava no Firestore em paralelo.
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patchFinal } : d)));
    updateDealDoc(id, patchFinal).catch((err) =>
      console.error("Erro ao salvar alteração do negócio no Firestore:", err)
    );
  }

  async function criarNegociosSeguintes(deal: Deal): Promise<ResultadoCadeia> {
    const resultado: ResultadoCadeia = {
      criados: [],
      destinosComErro: 0,
      documentosCopiados: 0,
      documentosComErro: 0,
      pessoasAvisadas: 0,
      avisoFalhou: false,
    };
    const destinos = PROXIMOS_APOS_GANHO[deal.funnelId] ?? [];
    if (destinos.length === 0) return resultado;

    // Documentos do negócio de origem: lidos uma vez e levados pra cada card novo.
    let docs: Awaited<ReturnType<typeof fetchDocumentos>> = [];
    try {
      docs = await fetchDocumentos(deal.id);
    } catch (err) {
      console.error("Erro ao ler os documentos do negócio:", err);
    }

    // Copia os dados do negócio (cliente, organização/pessoa, responsável, valor, UC, projeto...),
    // sem o que é do ciclo anterior (status, anexos, histórico, vínculo).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      id,
      createdAt,
      status,
      motivoPerda,
      fechadoEm,
      documentos,
      negocioOrigemId,
      historicoEtapas,
      previsaoFechamento,
      ...dados
    } = deal;

    for (const destino of destinos) {
      // Já existe card desse funil criado a partir deste negócio? Não duplica.
      if (deals.some((d) => d.negocioOrigemId === deal.id && d.funnelId === destino.funnelId)) {
        continue;
      }

      let novo: Deal;
      try {
        novo = await addDeal({
          ...dados,
          titulo: tituloComPrefixo(dados.titulo, destino.prefixoTitulo),
          funnelId: destino.funnelId,
          stageId: destino.stageId,
          status: "aberto",
          negocioOrigemId: deal.id,
        });
      } catch (err) {
        console.error("Erro ao criar o card seguinte:", err);
        resultado.destinosComErro++;
        continue;
      }

      const funil = FUNNELS.find((f) => f.id === destino.funnelId);
      const etapa = funil?.stages.find((e) => e.id === destino.stageId);
      resultado.criados.push({
        deal: novo,
        funilNome: funil?.name ?? destino.funnelId,
        etapaNome: etapa?.label ?? destino.stageId,
      });

      if (docs.length > 0) {
        const r = await copiarDocumentos(deal.id, novo.id, docs);
        resultado.documentosCopiados += r.copiados;
        resultado.documentosComErro += r.falhas.length;
      }

      if (destino.notificarFuncao) {
        try {
          const usuarios = await fetchAllUsuarios();
          const alvo = usuarios.filter((u) => u.funcao === destino.notificarFuncao).map((u) => u.id);
          if (alvo.length > 0) {
            await criarNotificacoesNovoNegocio({
              destinatarios: alvo,
              dealId: novo.id,
              dealTitulo: novo.titulo,
              autorId: currentUser.id,
              autorNome: currentUser.nome,
              destino: `${funil?.name ?? ""} · ${etapa?.label ?? ""}`,
            });
          }
          resultado.pessoasAvisadas += alvo.length;
        } catch (err) {
          console.error("Erro ao avisar a equipe do novo card:", err);
          resultado.avisoFalhou = true;
        }
      }
    }
    return resultado;
  }

  async function removeDeal(id: string): Promise<void> {
    await deleteDealDoc(id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  async function duplicateDeal(deal: Deal): Promise<Deal> {
    const copia = await duplicateDealDoc(deal);
    setDeals((prev) => [copia, ...prev]);
    return copia;
  }

  function addLead(lead: Omit<Lead, "id" | "stage">): Lead {
    const full: Lead = { ...lead, id: `l${Date.now()}`, stage: "novo_lead" };
    setLeads((prev) => [full, ...prev]);
    return full;
  }

  function updateLead(id: string, patch: Partial<Lead>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function getOrganizacao(id?: string) {
    return id ? organizacoes.find((o) => o.id === id) : undefined;
  }

  function getPessoa(id?: string) {
    return id ? pessoas.find((p) => p.id === id) : undefined;
  }

  const value = useMemo(
    () => ({
      organizacoes,
      pessoas,
      clientes,
      clientesLoading,
      deals,
      dealsLoading,
      leads,
      currentUser,
      addOrganizacao,
      addPessoa,
      addDeal,
      updateDeal,
      removeDeal,
      duplicateDeal,
      criarNegociosSeguintes,
      addLead,
      updateLead,
      getOrganizacao,
      getPessoa,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organizacoes, pessoas, clientes, clientesLoading, deals, dealsLoading, leads, currentUser]
  );

  return <CrmDataContext.Provider value={value}>{children}</CrmDataContext.Provider>;
}
