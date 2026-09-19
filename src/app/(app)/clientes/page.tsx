"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
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
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl text-text-dark mb-1">Clientes</h1>
        <p className="text-[13px] text-text-gray">
          Cadastro completo de clientes — contato, endereço e dados energéticos.
        </p>
      </div>

      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="text-sm text-text-gray">
          <span className="font-semibold text-text-dark">
            {filtrados.length} clientes
          </span>
        </div>
        <Link
          href="/clientes/novo"
          className="btn-press flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors"
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
            {clientesLoading &&
              [0, 1, 2, 3, 4, 5].map((row) => (
                <tr key={row} className="border-b border-border-soft last:border-0">
                  <td className="px-5 py-3.5">
                    <div
                      className="h-3 w-14 rounded animate-skeleton bg-border-soft"
                      style={{ animationDelay: `${row * 60}ms` }}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div
                      className="h-3.5 w-32 rounded animate-skeleton bg-border-soft"
                      style={{ animationDelay: `${row * 60}ms` }}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div
                      className="h-3 w-20 rounded animate-skeleton bg-border-soft"
                      style={{ animationDelay: `${row * 60}ms` }}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div
                      className="h-3 w-24 rounded animate-skeleton bg-border-soft"
                      style={{ animationDelay: `${row * 60}ms` }}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div
                      className="h-3 w-16 rounded animate-skeleton bg-border-soft"
                      style={{ animationDelay: `${row * 60}ms` }}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div
                      className="h-5 w-20 rounded-md animate-skeleton bg-border-soft"
                      style={{ animationDelay: `${row * 60}ms` }}
                    />
                  </td>
                </tr>
              ))}
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
                <td colSpan={6} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="h-11 w-11 rounded-full bg-panel-bg flex items-center justify-center">
                      <Users size={18} className="text-text-faint" />
                    </div>
                    <p className="text-[13.5px] font-medium text-text-dark">
                      {clientes.length === 0 ? "Nenhum cliente cadastrado ainda" : "Nenhum cliente encontrado"}
                    </p>
                    <p className="text-[12.5px] text-text-faint">
                      {clientes.length === 0
                        ? 'Clique em "Novo cliente" pra começar.'
                        : "Tenta ajustar a busca."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
