"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Lead, LeadTipo, TIPO_LABEL } from "@/lib/types";

const TIPOS: LeadTipo[] = ["residencial", "comercial", "rural"];

export default function NewLeadModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (lead: Omit<Lead, "id" | "stage">) => void;
}) {
  const [cliente, setCliente] = useState("");
  const [local, setLocal] = useState("");
  const [tipo, setTipo] = useState<LeadTipo>("residencial");
  const [valor, setValor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente.trim() || !local.trim() || !responsavel.trim()) return;
    onCreate({
      cliente,
      local,
      tipo,
      responsavel,
      valor: Number(valor) || 0,
      tags: [],
    });
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-card-bg rounded-xl shadow-xl border border-border w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-text-dark text-base">
            Novo negócio
          </h2>
          <button
            onClick={onClose}
            className="text-text-faint hover:text-text-gray"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
              CLIENTE
            </label>
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nome do cliente"
              className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
              LOCAL
            </label>
            <input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Endereço ou referência"
              className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
                VALOR (R$)
              </label>
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="0"
                className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
                RESPONSÁVEL
              </label>
              <input
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome"
                className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
              TIPO
            </label>
            <div className="flex gap-2">
              {TIPOS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                    tipo === t
                      ? "bg-brand border-brand text-text-dark"
                      : "bg-panel-bg border-border text-text-gray hover:text-text-dark"
                  }`}
                >
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-brand text-text-dark font-semibold text-sm py-2.5 mt-1 hover:bg-brand-strong transition-colors"
          >
            Adicionar ao funil
          </button>
        </form>
      </div>
    </div>
  );
}
