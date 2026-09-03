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
import { MOCK_ORGANIZACOES } from "@/lib/mock-organizacoes";
import { MOCK_PESSOAS } from "@/lib/mock-pessoas";
import { MOCK_DEALS } from "@/lib/mock-deals";
import { MOCK_LEADS } from "@/lib/mock-leads";
import { fetchClientes, createCliente } from "@/lib/firebase/clientes";

type CrmDataContextValue = {
  organizacoes: Organizacao[];
  pessoas: Pessoa[];
  clientes: Cliente[];
  /** true enquanto a lista de clientes ainda está sendo carregada do Firestore. */
  clientesLoading: boolean;
  deals: Deal[];
  leads: Lead[];
  /** Usuário real, autenticado via Firebase Auth + Firestore (ver AuthContext). */
  currentUser: Usuario;
  addOrganizacao: (org: Organizacao) => void;
  addPessoa: (pessoa: Pessoa) => void;
  addDeal: (deal: Omit<Deal, "id" | "createdAt">) => Deal;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
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
  // Funil/Leads ainda são dados fictícios em memória — próxima frente a migrar pro Firestore.
  const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);

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

  function addOrganizacao(org: Organizacao) {
    setOrganizacoes((prev) => [org, ...prev]);
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

  function addDeal(deal: Omit<Deal, "id" | "createdAt">): Deal {
    const full: Deal = {
      ...deal,
      id: `d${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDeals((prev) => [...prev, full]);
    return full;
  }

  function updateDeal(id: string, patch: Partial<Deal>) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
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
      leads,
      currentUser,
      addOrganizacao,
      addPessoa,
      addDeal,
      updateDeal,
      addLead,
      updateLead,
      getOrganizacao,
      getPessoa,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organizacoes, pessoas, clientes, clientesLoading, deals, leads, currentUser]
  );

  return <CrmDataContext.Provider value={value}>{children}</CrmDataContext.Provider>;
}
