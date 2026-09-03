"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, Download, Upload } from "lucide-react";
import {
  Cliente,
  ClienteStatus,
  CLIENTE_STATUS_LABEL,
  CLIENTE_STATUS_STYLE,
  LeadTipo,
  TIPO_LABEL,
} from "@/lib/types";
import { MOCK_CLIENTES } from "@/lib/mock-clientes";
import NewClienteModal from "./NewClienteModal";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(iso?: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function ClientesTable() {
  const [clientes, setClientes] = useState<Cliente[]>(MOCK_CLIENTES);
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<LeadTipo | "todos">("todos");
  const [statusFiltro, setStatusFiltro] = useState<ClienteStatus | "todos">(
    "todos"
  );
  const [modalOpen, setModalOpen] = useState(false);

  const filtrados = useMemo(() => {
    return clientes.filter((c) => {
      const termo = busca.trim().toLowerCase();
      const bateBusca =
        termo === "" ||
        c.nome.toLowerCase().includes(termo) ||
        c.cpfCnpj.toLowerCase().includes(termo) ||
        c.codigo.toLowerCase().includes(termo) ||
        c.endereco.cidade.toLowerCase().includes(termo);
      const bateTipo = tipoFiltro === "todos" || c.tipo === tipoFiltro;
      const bateStatus = statusFiltro === "todos" || c.status === statusFiltro;
      return bateBusca && bateTipo && bateStatus;
    });
  }, [clientes, busca, tipoFiltro, statusFiltro]);

  const valorEmNegociacao = filtrados.reduce(
    (sum, c) => sum + (c.valorEmNegociacao ?? 0),
    0
  );

  function handleCreate(
    novo: Omit<
      Cliente,
      | "id"
      | "codigo"
      | "propostas"
      | "contratos"
      | "instalacoes"
      | "criadoEm"
      | "historico"
      | "status"
    >
  ) {
    const proximoNumero = clientes.length + 1;
    setClientes((prev) => [
      {
        ...novo,
        id: `c${Date.now()}`,
        codigo: `CLI-${String(proximoNumero).padStart(4, "0")}`,
        status: "lead",
        propostas: 0,
        contratos: 0,
        instalacoes: 0,
        criadoEm: new Date().toISOString().slice(0, 10),
        historico: [],
      },
      ...prev,
    ]);
    setModalOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="text-sm text-text-gray">
          <span className="font-semibold text-text-dark">
            {filtrados.length} clientes
          </span>
          {valorEmNegociacao > 0 && (
            <>
              {" · "}
              {formatBRL(valorEmNegociacao)} em negociação
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-border text-text-gray font-semibold text-sm px-3.5 py-2 hover:bg-panel-bg transition-colors">
            <Upload size={15} />
            Importar
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-border text-text-gray font-semibold text-sm px-3.5 py-2 hover:bg-panel-bg transition-colors">
            <Download size={15} />
            Exportar
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand text-white font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors"
          >
            <Plus size={16} />
            Novo cliente
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, código ou cidade..."
            className="w-full rounded-lg border border-border bg-panel-bg pl-9 pr-3 py-2 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
        </div>

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value as LeadTipo | "todos")}
          className="rounded-lg border border-border bg-panel-bg px-3 py-2 text-sm text-text-dark outline-none focus:border-brand"
        >
          <option value="todos">Todos os tipos</option>
          {(Object.keys(TIPO_LABEL) as LeadTipo[]).map((t) => (
            <option key={t} value={t}>
              {TIPO_LABEL[t]}
            </option>
          ))}
        </select>

        <select
          value={statusFiltro}
          onChange={(e) =>
            setStatusFiltro(e.target.value as ClienteStatus | "todos")
          }
          className="rounded-lg border border-border bg-panel-bg px-3 py-2 text-sm text-text-dark outline-none focus:border-brand"
        >
          <option value="todos">Todos os status</option>
          {(Object.keys(CLIENTE_STATUS_LABEL) as ClienteStatus[]).map((s) => (
            <option key={s} value={s}>
              {CLIENTE_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-faint">
              <th className="px-5 py-3 font-semibold">Código</th>
              <th className="px-5 py-3 font-semibold">Cliente</th>
              <th className="px-5 py-3 font-semibold">CPF/CNPJ</th>
              <th className="px-5 py-3 font-semibold">Cidade</th>
              <th className="px-5 py-3 font-semibold">Contato</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Responsável</th>
              <th className="px-5 py-3 font-semibold">Último contato</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border-soft last:border-0 hover:bg-panel-bg/60 transition-colors"
              >
                <td className="px-5 py-3.5 text-text-faint font-mono text-xs">
                  {c.codigo}
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="font-semibold text-text-dark hover:text-brand transition-colors"
                  >
                    {c.nome}
                  </Link>
                  {c.nomeFantasia && (
                    <div className="text-xs text-text-faint">
                      {c.nomeFantasia}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5 text-text-gray">{c.cpfCnpj}</td>
                <td className="px-5 py-3.5 text-text-gray">
                  {c.endereco.cidade}/{c.endereco.estado}
                </td>
                <td className="px-5 py-3.5 text-text-gray">
                  {c.whatsapp ?? c.telefone}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`text-[11px] font-medium rounded px-2 py-1 ${CLIENTE_STATUS_STYLE[c.status]}`}
                  >
                    {CLIENTE_STATUS_LABEL[c.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-brand-soft text-brand text-[10px] font-bold flex items-center justify-center">
                      {c.responsavel.charAt(0)}
                    </div>
                    <span className="text-text-gray">{c.responsavel}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-text-gray">
                  {formatData(c.ultimoContato)}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-text-faint">
                  Nenhum cliente encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <NewClienteModal
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
