"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Cliente, LeadTipo, TipoPessoa, TIPO_LABEL, TIPO_PESSOA_LABEL } from "@/lib/types";

const TIPOS: LeadTipo[] = ["residencial", "comercial", "rural"];
const TIPOS_PESSOA: TipoPessoa[] = ["PF", "PJ"];

type NovoCliente = Omit<
  Cliente,
  | "id"
  | "codigo"
  | "propostas"
  | "contratos"
  | "instalacoes"
  | "criadoEm"
  | "historico"
  | "status"
>;

export default function NewClienteModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (cliente: NovoCliente) => void;
}) {
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("PF");
  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("RN");
  const [tipo, setTipo] = useState<LeadTipo>("residencial");
  const [responsavel, setResponsavel] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !cpfCnpj.trim() || !telefone.trim() || !cidade.trim() || !responsavel.trim()) {
      return;
    }
    onCreate({
      tipoPessoa,
      nome,
      cpfCnpj,
      telefone,
      whatsapp: telefone,
      email: email || undefined,
      endereco: { cidade, estado },
      tipo,
      responsavel,
      tags: [],
    });
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-card-bg rounded-xl shadow-xl border border-border w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-text-dark text-base">
            Novo cliente
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
              TIPO DE PESSOA
            </label>
            <div className="flex gap-2">
              {TIPOS_PESSOA.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTipoPessoa(t)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                    tipoPessoa === t
                      ? "bg-brand border-brand text-white"
                      : "bg-panel-bg border-border text-text-gray hover:text-text-dark"
                  }`}
                >
                  {TIPO_PESSOA_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
              {tipoPessoa === "PF" ? "NOME COMPLETO" : "RAZÃO SOCIAL"}
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={tipoPessoa === "PF" ? "Nome do cliente" : "Nome da empresa"}
              className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
              {tipoPessoa === "PF" ? "CPF" : "CNPJ"}
            </label>
            <input
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              placeholder={tipoPessoa === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
              className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
                TELEFONE / WHATSAPP
              </label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
                EMAIL
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opcional"
                className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
                CIDADE
              </label>
              <input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
                className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
                UF
              </label>
              <input
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="RN"
                maxLength={2}
                className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-gray mb-1.5 tracking-wide">
              RESPONSÁVEL
            </label>
            <input
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Nome do vendedor/consultor"
              className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
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
                      ? "bg-brand border-brand text-white"
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
            className="w-full rounded-lg bg-brand text-white font-semibold text-sm py-2.5 mt-1 hover:bg-brand-strong transition-colors"
          >
            Cadastrar cliente
          </button>
        </form>
      </div>
    </div>
  );
}
