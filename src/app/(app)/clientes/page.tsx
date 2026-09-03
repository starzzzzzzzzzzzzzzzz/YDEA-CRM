"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Loader2 } from "lucide-react";
import { STATUS_LABEL, TEMPERATURA_LABEL, CLIENTE_STATUS_STYLE } from "@/lib/types";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { useState } from "react";

export default function ClientesPage() {
  const router = useRouter();
  const { clientes, clientesLoading } = useCrmData();
  const [busca, setBusca] = useState("");

  const filtrados = clientes.filter(
    (c) =>
      busca.trim() === "" ||
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.cidade.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="text-sm text-text-gray">
          <span className="font-semibold text-text-dark">
            {filtrados.length} clientes
          </span>
        </div>
        <Link
          href="/clientes/novo"
          className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors"
        >
          <Plus size={16} />
          Novo cliente
        </Link>
      </div>

      <div className="relative max-w-xs mb-4">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
        />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou cidade..."
          className="w-full rounded-lg border border-border bg-panel-bg pl-9 pr-3 py-2 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-faint">
              <th className="px-5 py-3 font-semibold">Código</th>
              <th className="px-5 py-3 font-semibold">Nome</th>
              <th className="px-5 py-3 font-semibold">Cidade/UF</th>
              <th className="px-5 py-3 font-semibold">Responsável</th>
              <th className="px-5 py-3 font-semibold">Temperatura</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {clientesLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-text-faint">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin" />
                    Carregando clientes do Firestore...
                  </span>
                </td>
              </tr>
            )}
            {!clientesLoading &&
              filtrados.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/clientes/${c.id}`)}
                  className="border-b border-border-soft last:border-0 hover:bg-panel-bg/60 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-mono text-text-faint">{c.codigo}</td>
                  <td className="px-5 py-3.5 font-semibold text-text-dark">{c.nome}</td>
                  <td className="px-5 py-3.5 text-text-gray">
                    {c.cidade}/{c.estado}
                  </td>
                  <td className="px-5 py-3.5 text-text-gray">{c.responsavel}</td>
                  <td className="px-5 py-3.5 text-text-gray">
                    {TEMPERATURA_LABEL[c.temperatura]}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[11px] font-medium px-2 py-1 rounded-md ${CLIENTE_STATUS_STYLE[c.status]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            {!clientesLoading && filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-text-faint">
                  {clientes.length === 0
                    ? 'Nenhum cliente cadastrado ainda. Clique em "Novo cliente" pra começar.'
                    : "Nenhum cliente encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
