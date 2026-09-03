"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Field, SectionTitle, inputClass, inputErrorClass } from "@/components/ui/Field";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { useToast } from "@/components/ui/Toast";
import { Pessoa, Organizacao } from "@/lib/types";
import { maskCPF, maskPhone, maskCEP } from "@/lib/masks";

export default function PessoaModal({
  initialNome = "",
  organizacao,
  onClose,
  onCreated,
}: {
  initialNome?: string;
  organizacao: Organizacao | null;
  onClose: () => void;
  onCreated: (pessoa: Pessoa) => void;
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Pessoa>>({
    nome: initialNome,
    organizacaoId: organizacao?.id,
  });
  const [erro, setErro] = useState<string | null>(null);

  function set<K extends keyof Pessoa>(key: K, value: Pessoa[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.nome?.trim()) {
      setErro("Informe o nome.");
      return;
    }
    setErro(null);
    setSaving(true);
    setTimeout(() => {
      const pessoa: Pessoa = {
        id: `pes${Date.now()}`,
        organizacaoId: organizacao?.id ?? form.organizacaoId,
        nome: form.nome!.trim(),
        cpf: form.cpf,
        rg: form.rg,
        dataNascimento: form.dataNascimento,
        cargo: form.cargo,
        telefone: form.telefone,
        whatsapp: form.whatsapp,
        email: form.email,
        endereco: form.endereco,
        numero: form.numero,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep,
        responsavel: form.responsavel,
        canalOrigem: form.canalOrigem,
        observacoes: form.observacoes,
      };
      setSaving(false);
      showToast("Pessoa criada com sucesso");
      onCreated(pessoa);
    }, 500);
  }

  return (
    <Modal onClose={onClose} widthClass="max-w-[900px]" labelledBy="pessoa-modal-title">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border-soft shrink-0">
        <h2 id="pessoa-modal-title" className="font-display font-semibold text-base text-text-dark">
          Nova Pessoa
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
        <div className="space-y-4">
          <SectionTitle>Dados</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome" required error={erro ?? undefined} className="sm:col-span-2">
              <input
                autoFocus
                className={`${inputClass} ${erro ? inputErrorClass : ""}`}
                value={form.nome ?? ""}
                onChange={(e) => {
                  set("nome", e.target.value);
                  if (erro) setErro(null);
                }}
                placeholder="Ex: João Silva"
              />
            </Field>
            <Field label="CPF">
              <input className={inputClass} value={form.cpf ?? ""} onChange={(e) => set("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" />
            </Field>
            <Field label="RG">
              <input className={inputClass} value={form.rg ?? ""} onChange={(e) => set("rg", e.target.value)} />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" className={inputClass} value={form.dataNascimento ?? ""} onChange={(e) => set("dataNascimento", e.target.value)} />
            </Field>
            <Field label="Cargo">
              <input className={inputClass} value={form.cargo ?? ""} onChange={(e) => set("cargo", e.target.value)} />
            </Field>
            <Field label="Organização" className="sm:col-span-2">
              <input
                disabled={!!organizacao}
                className={inputClass}
                value={organizacao?.nome ?? ""}
                placeholder="Nenhuma organização vinculada"
                readOnly
              />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <SectionTitle>Contato</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telefone">
              <input className={inputClass} value={form.telefone ?? ""} onChange={(e) => set("telefone", maskPhone(e.target.value))} placeholder="(00) 0000-0000" />
            </Field>
            <Field label="WhatsApp">
              <input className={inputClass} value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <input type="email" className={inputClass} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="nome@email.com" />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <SectionTitle subtitle="Integrado ao Google Places — selecione para preencher automaticamente">
            Endereço
          </SectionTitle>
          <AddressAutocomplete
            onSelect={(p) => {
              set("endereco", p.endereco);
              set("numero", p.numero);
              set("bairro", p.bairro);
              set("cidade", p.cidade);
              set("estado", p.estado);
              set("cep", p.cep);
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Rua" className="sm:col-span-2">
              <input className={inputClass} value={form.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} />
            </Field>
            <Field label="Número">
              <input className={inputClass} value={form.numero ?? ""} onChange={(e) => set("numero", e.target.value)} />
            </Field>
            <Field label="Cidade">
              <input className={inputClass} value={form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} />
            </Field>
            <Field label="Estado">
              <input className={inputClass} value={form.estado ?? ""} onChange={(e) => set("estado", e.target.value)} />
            </Field>
            <Field label="CEP">
              <input className={inputClass} value={form.cep ?? ""} onChange={(e) => set("cep", maskCEP(e.target.value))} />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <SectionTitle>Comercial</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Responsável">
              <input className={inputClass} value={form.responsavel ?? ""} onChange={(e) => set("responsavel", e.target.value)} />
            </Field>
            <Field label="Canal de origem">
              <input className={inputClass} value={form.canalOrigem ?? ""} onChange={(e) => set("canalOrigem", e.target.value)} placeholder="Indicação, Site, Instagram..." />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <textarea rows={3} className={inputClass} value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-soft shrink-0">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-text-gray hover:bg-panel-bg transition-colors">
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-brand text-text-dark font-semibold text-sm px-5 py-2.5 hover:bg-brand-strong transition-colors disabled:opacity-70"
        >
          {saving && <Loader2 size={15} className="animate-spin-slow" />}
          Salvar Pessoa
        </button>
      </div>
    </Modal>
  );
}
