"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Zap, Download } from "lucide-react";
import { Lead, LeadTipo, STAGES, StageId, TIPO_LABEL } from "@/lib/types";
import { useCrmData } from "@/lib/store/CrmDataContext";
import NewLeadModal from "../instalacoes/NewLeadModal";

const TAG_STYLES: Record<string, string> = {
  urgente: "bg-badge-red-bg text-badge-red-text",
  financiamento: "bg-badge-blue-bg text-badge-blue-text",
  indicação: "bg-badge-green-bg text-badge-green-text",
};

const STAGE_LABEL: Record<StageId, string> = Object.fromEntries(
  STAGES.map((s) => [s.id, s.label])
) as Record<StageId, string>;

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function LeadsTable() {
  const { leads, addLead } = useCrmData();
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<LeadTipo | "todos">("todos");
  const [stageFiltro, setStageFiltro] = useState<StageId | "todas">("todas");
  const [modalOpen, setModalOpen] = useState(false);

  const filtrados = useMemo(() => {
    return leads.filter((l) => {
      const bateBusca =
        busca.trim() === "" ||
        l.cliente.toLowerCase().includes(busca.toLowerCase()) ||
        l.local.toLowerCase().includes(busca.toLowerCase());
      const bateTipo = tipoFiltro === "todos" || l.tipo === tipoFiltro;
      const bateStage = stageFiltro === "todas" || l.stage === stageFiltro;
      return bateBusca && bateTipo && bateStage;
    });
  }, [leads, busca, tipoFiltro, stageFiltro]);

  const valorTotal = filtrados.reduce((sum, l) => sum + l.valor, 0);

  function handleCreate(newLead: Omit<Lead, "id" | "stage">) {
    addLead(newLead);
    setModalOpen(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl text-text-dark mb-1">Leads</h1>
        <p className="text-[13px] text-text-gray">
          Contatos que ainda não viraram cliente — acompanhe até virarem negócio no funil.
        </p>
      </div>

      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="text-sm text-text-gray">
          <span className="font-semibold text-text-dark">
            {filtrados.length} leads
          </span>
          {" · "}
          {formatBRL(valorTotal)}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-border text-text-gray font-semibold text-sm px-3.5 py-2 hover:bg-panel-bg transition-colors">
            <Download size={15} />
            Importar
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors"
          >
            <Plus size={16} />
            Novo lead
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
            placeholder="Buscar por cliente ou local..."
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
          value={stageFiltro}
          onChange={(e) => setStageFiltro(e.target.value as StageId | "todas")}
          className="rounded-lg border border-border bg-panel-bg px-3 py-2 text-sm text-text-dark outline-none focus:border-brand"
        >
          <option value="todas">Todas as etapas</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-faint">
              <th className="px-5 py-3 font-semibold">Cliente</th>
              <th className="px-5 py-3 font-semibold">Local</th>
              <th className="px-5 py-3 font-semibold">Tipo</th>
              <th className="px-5 py-3 font-semibold">Etapa</th>
              <th className="px-5 py-3 font-semibold">Potência</th>
              <th className="px-5 py-3 font-semibold">Valor</th>
              <th className="px-5 py-3 font-semibold">Responsável</th>
              <th className="px-5 py-3 font-semibold">Tags</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((l) => (
              <tr
                key={l.id}
                className="border-b border-border-soft last:border-0 hover:bg-panel-bg/60 transition-colors"
              >
                <td className="px-5 py-3.5 font-semibold text-text-dark">
                  {l.cliente}
                </td>
                <td className="px-5 py-3.5 text-text-gray max-w-[200px] truncate">
                  {l.local}
                </td>
                <td className="px-5 py-3.5 text-text-gray">
                  {TIPO_LABEL[l.tipo]}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] font-medium text-text-gray bg-panel-bg rounded px-2 py-1">
                    {STAGE_LABEL[l.stage]}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {l.potenciaKwp ? (
                    <span className="flex items-center gap-1 text-brand-strong font-semibold text-xs">
                      <Zap size={12} />
                      {l.potenciaKwp} kWp
                    </span>
                  ) : (
                    <span className="text-text-faint">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 font-mono font-semibold text-text-dark">
                  {formatBRL(l.valor)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-brand-soft text-brand-strong text-[10px] font-bold flex items-center justify-center">
                      {l.responsavel.charAt(0)}
                    </div>
                    <span className="text-text-gray">{l.responsavel}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {l.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${
                          TAG_STYLES[tag] ?? "bg-panel-bg text-text-gray"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-text-faint">
                  Nenhum lead encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <NewLeadModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
