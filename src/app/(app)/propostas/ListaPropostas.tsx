"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { fetchPropostas } from "@/lib/firebase/propostas";
import { formatarBRL, formatarNumero } from "@/lib/propostas/proposal-text";
import type { PropostaSalva } from "@/lib/propostas/types";

export default function ListaPropostas({ dealId }: { dealId?: string }) {
  const [rows, setRows] = useState<PropostaSalva[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    fetchPropostas(dealId)
      .then((r) => !cancelado && setRows(r))
      .catch((err) => {
        console.error("Erro ao carregar propostas:", err);
        if (!cancelado) setErro(true);
      });
    return () => {
      cancelado = true;
    };
  }, [dealId]);

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-semibold text-xl text-text-dark">Propostas</h1>
        <Link
          href="/propostas/nova"
          className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-3.5 py-2 hover:bg-brand-strong transition-colors"
        >
          <FilePlus2 size={15} /> Nova proposta
        </Link>
      </div>

      <div className="bg-card-bg border border-border rounded-xl overflow-hidden">
        {erro ? (
          <p className="p-6 text-sm text-badge-red-text">Não foi possível carregar as propostas.</p>
        ) : rows === null ? (
          <p className="p-6 text-sm text-text-faint">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-text-faint">Nenhuma proposta ainda.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-text-faint border-b border-border-soft">
                <th className="px-4 py-2.5 font-medium">Nº</th>
                <th className="px-4 py-2.5 font-medium">Cliente / projeto</th>
                <th className="px-4 py-2.5 font-medium text-right">Potência</th>
                <th className="px-4 py-2.5 font-medium text-right">Valor</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Criada em</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-border-soft last:border-0 hover:bg-panel-bg">
                  <td className="px-4 py-2.5 font-semibold">
                    <Link href={`/propostas/${p.id}`} className="text-brand-strong hover:underline">
                      {p.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-text-dark">{p.clienteNome}</div>
                    <div className="text-[11.5px] text-text-faint">{p.nomeProjeto}</div>
                  </td>
                  <td className="px-4 py-2.5 text-right">{formatarNumero(p.potenciaKwp)} kWp</td>
                  <td className="px-4 py-2.5 text-right">{formatarBRL(p.valorTotal)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.status === "finalizada" ? "bg-badge-green-bg text-badge-green-text" : "bg-badge-amber-bg text-badge-amber-text"}`}>
                      {p.status === "finalizada" ? "Finalizada" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-gray">{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
