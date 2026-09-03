"use client";

import { useState } from "react";
import { Building2, User2, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Field, SectionTitle, inputClass, inputErrorClass } from "@/components/ui/Field";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { useToast } from "@/components/ui/Toast";
import { Organizacao, TipoOrganizacao } from "@/lib/types";
import { maskCPF, maskCNPJ, maskPhone, maskCEP } from "@/lib/masks";

export default function OrganizacaoModal({
  initialNome = "",
  onClose,
  onCreated,
}: {
  initialNome?: string;
  onClose: () => void;
  onCreated: (org: Organizacao) => void;
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Organizacao>>({
    nome: initialNome,
    tipo: "PJ",
    tags: [],
  });
  const [erro, setErro] = useState<string | null>(null);

  function set<K extends keyof Organizacao>(key: K, value: Organizacao[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isPJ = form.tipo === "PJ";

  function handleSave() {
    if (!form.nome?.trim()) {
      setErro("Informe o nome da organização.");
      return;
    }
    setErro(null);
    setSaving(true);
    setTimeout(() => {
      const org: Organizacao = {
        id: `org${Date.now()}`,
        nome: form.nome!.trim(),
        tipo: form.tipo ?? "PJ",
        cpf: form.cpf,
        cnpj: form.cnpj,
        razaoSocial: form.razaoSocial,
        nomeFantasia: form.nomeFantasia,
        telefone: form.telefone,
        whatsapp: form.whatsapp,
        email: form.email,
        site: form.site,
        endereco: form.endereco,
        numero: form.numero,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep,
        latitude: form.latitude,
        longitude: form.longitude,
        responsavel: form.responsavel,
        canalOrigem: form.canalOrigem,
        tags: form.tags ?? [],
        observacoes: form.observacoes,
      };
      setSaving(false);
      showToast("Organização criada com sucesso");
      onCreated(org);
    }, 500);
  }

  return (
    <Modal onClose={onClose} widthClass="max-w-[900px]" labelledBy="org-modal-title">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border-soft shrink-0">
        <h2 id="org-modal-title" className="font-display font-semibold text-base text-text-dark">
          Nova Organização
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
        <div className="space-y-4">
          <SectionTitle>Dados Básicos</SectionTitle>
          <div className="flex gap-2.5">
            {(["PJ", "PF"] as TipoOrganizacao[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("tipo", t)}
                className={`flex-1 flex items-center gap-2 justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  form.tipo === t
                    ? "border-brand bg-brand-soft text-brand-strong"
                    : "border-border text-text-gray hover:bg-panel-bg"
                }`}
              >
                {t === "PJ" ? <Building2 size={15} /> : <User2 size={15} />}
                {t === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome da organização" required error={erro ?? undefined} className="sm:col-span-2">
              <input
                autoFocus
                className={`${inputClass} ${erro ? inputErrorClass : ""}`}
                value={form.nome ?? ""}
                onChange={(e) => {
                  set("nome", e.target.value);
                  if (erro) setErro(null);
                }}
                placeholder="Ex: Solar Engenharia"
              />
            </Field>
            {isPJ ? (
              <>
                <Field label="CNPJ">
                  <input
                    className={inputClass}
                    value={form.cnpj ?? ""}
                    onChange={(e) => set("cnpj", maskCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                  />
                </Field>
                <Field label="Razão social">
                  <input
                    className={inputClass}
                    value={form.razaoSocial ?? ""}
                    onChange={(e) => set("razaoSocial", e.target.value)}
                  />
                </Field>
                <Field label="Nome fantasia">
                  <input
                    className={inputClass}
                    value={form.nomeFantasia ?? ""}
                    onChange={(e) => set("nomeFantasia", e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <Field label="CPF">
                <input
                  className={inputClass}
                  value={form.cpf ?? ""}
                  onChange={(e) => set("cpf", maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </Field>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <SectionTitle>Contato</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telefone">
              <input
                className={inputClass}
                value={form.telefone ?? ""}
                onChange={(e) => set("telefone", maskPhone(e.target.value))}
                placeholder="(00) 0000-0000"
              />
            </Field>
            <Field label="WhatsApp">
              <input
                className={inputClass}
                value={form.whatsapp ?? ""}
                onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contato@empresa.com.br"
              />
            </Field>
            <Field label="Site">
              <input
                className={inputClass}
                value={form.site ?? ""}
                onChange={(e) => set("site", e.target.value)}
                placeholder="https://"
              />
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
              set("latitude", p.latitude);
              set("longitude", p.longitude);
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Rua" className="sm:col-span-2">
              <input className={inputClass} value={form.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} />
            </Field>
            <Field label="Número">
              <input className={inputClass} value={form.numero ?? ""} onChange={(e) => set("numero", e.target.value)} />
            </Field>
            <Field label="Bairro">
              <input className={inputClass} value={form.bairro ?? ""} onChange={(e) => set("bairro", e.target.value)} />
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
            <Field label="Latitude">
              <input
                className={inputClass}
                value={form.latitude ?? ""}
                onChange={(e) => set("latitude", Number(e.target.value) || undefined)}
              />
            </Field>
            <Field label="Longitude">
              <input
                className={inputClass}
                value={form.longitude ?? ""}
                onChange={(e) => set("longitude", Number(e.target.value) || undefined)}
              />
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
              <input
                className={inputClass}
                value={form.canalOrigem ?? ""}
                onChange={(e) => set("canalOrigem", e.target.value)}
                placeholder="Indicação, Site, Instagram..."
              />
            </Field>
            <Field label="Tags" className="sm:col-span-2">
              <input
                className={inputClass}
                value={(form.tags ?? []).join(", ")}
                onChange={(e) =>
                  set(
                    "tags",
                    e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                  )
                }
                placeholder="parceiro, prioridade..."
              />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <textarea
                rows={3}
                className={inputClass}
                value={form.observacoes ?? ""}
                onChange={(e) => set("observacoes", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-soft shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-text-gray hover:bg-panel-bg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-brand text-text-dark font-semibold text-sm px-5 py-2.5 hover:bg-brand-strong transition-colors disabled:opacity-70"
        >
          {saving && <Loader2 size={15} className="animate-spin-slow" />}
          Salvar Organização
        </button>
      </div>
    </Modal>
  );
}
