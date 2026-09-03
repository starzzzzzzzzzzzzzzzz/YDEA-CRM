"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, User2, Building2, Loader2 } from "lucide-react";
import {
  Cliente,
  TipoPessoa,
  Temperatura,
  TEMPERATURA_LABEL,
  ClienteStatus,
} from "@/lib/types";
import { createCliente } from "@/lib/firebase/clientes";

type FormState = Partial<Cliente>;

const STEPS = [
  "Tipo & Dados",
  "Contatos",
  "Endereço",
  "Comercial",
  "Energético",
  "Financeiro",
  "Revisão",
];

const ESTADOS = ["RN", "PB", "PE", "CE", "PI", "BA", "outro"];

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-[13px] font-medium text-text-dark mb-1.5">
        {label}
        {required && <span className="text-brand-strong"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors";

export default function ClienteWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    tipoPessoa: "PF",
    temperatura: "morno",
    status: "novo",
    tags: [],
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isPJ = form.tipoPessoa === "PJ";

  function validarEtapaAtual(): string | null {
    if (step === 0) {
      if (!form.nome?.trim()) return "Informe o nome" + (isPJ ? " fantasia" : " completo") + ".";
    }
    if (step === 1) {
      if (!form.whatsapp?.trim()) return "Informe o WhatsApp.";
      if (!form.email?.trim()) return "Informe o e-mail.";
    }
    if (step === 2) {
      if (!form.cidade?.trim()) return "Informe a cidade.";
      if (!form.estado?.trim()) return "Informe o estado.";
    }
    if (step === 3) {
      if (!form.responsavel?.trim()) return "Informe o responsável.";
    }
    return null;
  }

  const [erro, setErro] = useState<string | null>(null);

  function avancar() {
    const msg = validarEtapaAtual();
    if (msg) {
      setErro(msg);
      return;
    }
    setErro(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function voltar() {
    setErro(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finalizar() {
    setErroSalvar(null);
    setSaving(true);
    try {
      // Os campos obrigatórios (nome, telefone, whatsapp, email, cidade, estado,
      // responsavel) já foram validados etapa a etapa em validarEtapaAtual().
      await createCliente({
        tipoPessoa: form.tipoPessoa ?? "PF",
        nome: form.nome ?? "",
        nomeFantasia: form.nomeFantasia,
        razaoSocial: form.razaoSocial,
        cpf: form.cpf,
        cnpj: form.cnpj,
        rg: form.rg,
        inscricaoEstadual: form.inscricaoEstadual,
        dataNascimento: form.dataNascimento,
        estadoCivil: form.estadoCivil,
        profissao: form.profissao,
        empresa: form.empresa,
        cargo: form.cargo,
        telefone: form.telefone ?? "",
        telefoneSecundario: form.telefoneSecundario,
        whatsapp: form.whatsapp ?? "",
        email: form.email ?? "",
        emailSecundario: form.emailSecundario,
        site: form.site,
        cep: form.cep,
        endereco: form.endereco,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        cidade: form.cidade ?? "",
        estado: form.estado ?? "",
        referencia: form.referencia,
        origem: form.origem,
        canal: form.canal,
        responsavel: form.responsavel ?? "",
        score: form.score,
        temperatura: form.temperatura ?? "morno",
        status: form.status ?? "novo",
        tags: form.tags ?? [],
        observacoes: form.observacoes,
        distribuidora: form.distribuidora,
        unidadeConsumidora: form.unidadeConsumidora,
        classeConsumidora: form.classeConsumidora,
        grupoTarifario: form.grupoTarifario,
        consumoMedio: form.consumoMedio,
        tipoLigacao: form.tipoLigacao,
        formaPagamento: form.formaPagamento,
        condicaoPagamento: form.condicaoPagamento,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      setErroSalvar("Não foi possível salvar o cliente no Firestore. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <div className="h-14 w-14 rounded-full bg-badge-green-bg text-badge-green-text flex items-center justify-center mx-auto mb-4">
          <Check size={26} />
        </div>
        <h1 className="font-display font-semibold text-lg text-text-dark mb-2">
          Cliente cadastrado
        </h1>
        <p className="text-sm text-text-gray mb-6">
          {form.nome} foi adicionado à base de clientes.
        </p>
        <button
          onClick={() => router.push("/clientes")}
          className="rounded-lg bg-brand text-text-dark font-semibold text-sm px-5 py-2.5 hover:bg-brand-strong transition-colors"
        >
          Ver lista de clientes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center mb-8 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center shrink-0">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 ${i < step ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 ${
                  i < step
                    ? "bg-brand text-text-dark"
                    : i === step
                    ? "bg-brand-soft text-brand-strong border-2 border-brand"
                    : "bg-panel-bg text-text-faint"
                }`}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span
                className={`text-[12.5px] font-medium whitespace-nowrap ${
                  i <= step ? "text-text-dark" : "text-text-faint"
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-border mx-2 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card-bg p-6 md:p-8">
        {/* Etapa 0 — Tipo & Dados básicos */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-display font-semibold text-base text-text-dark mb-1">
              Tipo de pessoa e dados básicos
            </h2>
            <div className="flex gap-3">
              {(["PF", "PJ"] as TipoPessoa[]).map((t) => (
                <button
                  key={t}
                  onClick={() => set("tipoPessoa", t)}
                  className={`flex-1 flex items-center gap-2 justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    form.tipoPessoa === t
                      ? "border-brand bg-brand-soft text-brand-strong"
                      : "border-border text-text-gray hover:bg-panel-bg"
                  }`}
                >
                  {t === "PF" ? <User2 size={16} /> : <Building2 size={16} />}
                  {t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isPJ ? "Nome fantasia" : "Nome completo"} required>
                <input
                  className={inputClass}
                  value={form.nome ?? ""}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder={isPJ ? "Ex: Bom Preço Alimentos" : "Ex: João Paulo Medeiros"}
                />
              </Field>

              {isPJ ? (
                <Field label="Razão social">
                  <input
                    className={inputClass}
                    value={form.razaoSocial ?? ""}
                    onChange={(e) => set("razaoSocial", e.target.value)}
                  />
                </Field>
              ) : (
                <Field label="Profissão">
                  <input
                    className={inputClass}
                    value={form.profissao ?? ""}
                    onChange={(e) => set("profissao", e.target.value)}
                  />
                </Field>
              )}

              {isPJ ? (
                <Field label="CNPJ">
                  <input
                    className={inputClass}
                    value={form.cnpj ?? ""}
                    onChange={(e) => set("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </Field>
              ) : (
                <Field label="CPF">
                  <input
                    className={inputClass}
                    value={form.cpf ?? ""}
                    onChange={(e) => set("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </Field>
              )}

              {isPJ ? (
                <Field label="Inscrição estadual">
                  <input
                    className={inputClass}
                    value={form.inscricaoEstadual ?? ""}
                    onChange={(e) => set("inscricaoEstadual", e.target.value)}
                  />
                </Field>
              ) : (
                <Field label="Data de nascimento">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.dataNascimento ?? ""}
                    onChange={(e) => set("dataNascimento", e.target.value)}
                  />
                </Field>
              )}
            </div>
          </div>
        )}

        {/* Etapa 1 — Contatos */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display font-semibold text-base text-text-dark mb-1">
              Contatos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="WhatsApp" required>
                <input
                  className={inputClass}
                  value={form.whatsapp ?? ""}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="(84) 99999-0000"
                />
              </Field>
              <Field label="Telefone secundário">
                <input
                  className={inputClass}
                  value={form.telefoneSecundario ?? ""}
                  onChange={(e) => set("telefoneSecundario", e.target.value)}
                />
              </Field>
              <Field label="E-mail principal" required>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="cliente@email.com"
                />
              </Field>
              <Field label="E-mail secundário">
                <input
                  type="email"
                  className={inputClass}
                  value={form.emailSecundario ?? ""}
                  onChange={(e) => set("emailSecundario", e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Etapa 2 — Endereço */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display font-semibold text-base text-text-dark mb-1">
              Endereço
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="CEP">
                <input
                  className={inputClass}
                  value={form.cep ?? ""}
                  onChange={(e) => set("cep", e.target.value)}
                />
              </Field>
              <Field label="Rua" className="sm:col-span-2">
                <input
                  className={inputClass}
                  value={form.endereco ?? ""}
                  onChange={(e) => set("endereco", e.target.value)}
                />
              </Field>
              <Field label="Número">
                <input
                  className={inputClass}
                  value={form.numero ?? ""}
                  onChange={(e) => set("numero", e.target.value)}
                />
              </Field>
              <Field label="Bairro">
                <input
                  className={inputClass}
                  value={form.bairro ?? ""}
                  onChange={(e) => set("bairro", e.target.value)}
                />
              </Field>
              <Field label="Complemento">
                <input
                  className={inputClass}
                  value={form.complemento ?? ""}
                  onChange={(e) => set("complemento", e.target.value)}
                />
              </Field>
              <Field label="Cidade" required>
                <input
                  className={inputClass}
                  value={form.cidade ?? ""}
                  onChange={(e) => set("cidade", e.target.value)}
                />
              </Field>
              <Field label="Estado" required>
                <select
                  className={inputClass}
                  value={form.estado ?? ""}
                  onChange={(e) => set("estado", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* Etapa 3 — Comercial */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display font-semibold text-base text-text-dark mb-1">
              Informações comerciais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Origem">
                <input
                  className={inputClass}
                  value={form.origem ?? ""}
                  onChange={(e) => set("origem", e.target.value)}
                  placeholder="Indicação, Instagram, Site..."
                />
              </Field>
              <Field label="Responsável" required>
                <input
                  className={inputClass}
                  value={form.responsavel ?? ""}
                  onChange={(e) => set("responsavel", e.target.value)}
                />
              </Field>
              <Field label="Temperatura">
                <div className="flex gap-2">
                  {(["frio", "morno", "quente"] as Temperatura[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => set("temperatura", t)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        form.temperatura === t
                          ? "border-brand bg-brand-soft text-brand-strong"
                          : "border-border text-text-gray hover:bg-panel-bg"
                      }`}
                    >
                      {TEMPERATURA_LABEL[t]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Status">
                <select
                  className={inputClass}
                  value={form.status ?? "novo"}
                  onChange={(e) => set("status", e.target.value as ClienteStatus)}
                >
                  <option value="novo">Novo</option>
                  <option value="em_negociacao">Em negociação</option>
                  <option value="cliente_ativo">Cliente ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </Field>
            </div>
            <Field label="Observações">
              <textarea
                className={inputClass}
                rows={3}
                value={form.observacoes ?? ""}
                onChange={(e) => set("observacoes", e.target.value)}
              />
            </Field>
          </div>
        )}

        {/* Etapa 4 — Energético */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display font-semibold text-base text-text-dark mb-1">
              Dados energéticos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Distribuidora">
                <input
                  className={inputClass}
                  value={form.distribuidora ?? ""}
                  onChange={(e) => set("distribuidora", e.target.value)}
                  placeholder="Cosern"
                />
              </Field>
              <Field label="Unidade consumidora (UC)">
                <input
                  className={inputClass}
                  value={form.unidadeConsumidora ?? ""}
                  onChange={(e) => set("unidadeConsumidora", e.target.value)}
                />
              </Field>
              <Field label="Classe consumidora">
                <input
                  className={inputClass}
                  value={form.classeConsumidora ?? ""}
                  onChange={(e) => set("classeConsumidora", e.target.value)}
                  placeholder="Residencial, Comercial, Rural..."
                />
              </Field>
              <Field label="Grupo tarifário">
                <input
                  className={inputClass}
                  value={form.grupoTarifario ?? ""}
                  onChange={(e) => set("grupoTarifario", e.target.value)}
                  placeholder="B1, A4..."
                />
              </Field>
              <Field label="Consumo médio (kWh/mês)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.consumoMedio ?? ""}
                  onChange={(e) => set("consumoMedio", Number(e.target.value))}
                />
              </Field>
              <Field label="Tipo de ligação">
                <input
                  className={inputClass}
                  value={form.tipoLigacao ?? ""}
                  onChange={(e) => set("tipoLigacao", e.target.value)}
                  placeholder="Mono, Bi, Trifásica"
                />
              </Field>
            </div>
          </div>
        )}

        {/* Etapa 5 — Financeiro */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="font-display font-semibold text-base text-text-dark mb-1">
              Dados financeiros
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Forma de pagamento">
                <input
                  className={inputClass}
                  value={form.formaPagamento ?? ""}
                  onChange={(e) => set("formaPagamento", e.target.value)}
                  placeholder="À vista, financiado, cartão..."
                />
              </Field>
              <Field label="Condição de pagamento">
                <input
                  className={inputClass}
                  value={form.condicaoPagamento ?? ""}
                  onChange={(e) => set("condicaoPagamento", e.target.value)}
                  placeholder="Ex: 12x sem juros"
                />
              </Field>
            </div>
          </div>
        )}

        {/* Etapa 6 — Revisão */}
        {step === 6 && (
          <div className="space-y-5">
            <h2 className="font-display font-semibold text-base text-text-dark mb-1">
              Revisão
            </h2>
            <p className="text-sm text-text-gray mb-2">
              Confira os dados antes de salvar o cadastro.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Tipo", isPJ ? "Pessoa Jurídica" : "Pessoa Física"],
                ["Nome", form.nome || "—"],
                [isPJ ? "CNPJ" : "CPF", (isPJ ? form.cnpj : form.cpf) || "—"],
                ["WhatsApp", form.whatsapp || "—"],
                ["E-mail", form.email || "—"],
                ["Cidade/UF", `${form.cidade || "—"}/${form.estado || "—"}`],
                ["Responsável", form.responsavel || "—"],
                ["Temperatura", form.temperatura ? TEMPERATURA_LABEL[form.temperatura] : "—"],
                ["Distribuidora", form.distribuidora || "—"],
                ["UC", form.unidadeConsumidora || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-border-soft pb-2">
                  <dt className="text-text-faint">{label}</dt>
                  <dd className="font-medium text-text-dark text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {erro && (
          <p className="mt-4 text-sm text-badge-red-text bg-badge-red-bg rounded-lg px-3 py-2">
            {erro}
          </p>
        )}

        {/* Navegação */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border-soft">
          <button
            onClick={voltar}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-text-gray disabled:opacity-0 hover:text-text-dark transition-colors"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={avancar}
              className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-5 py-2.5 hover:bg-brand-strong transition-colors"
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={finalizar}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-5 py-2.5 hover:bg-brand-strong transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? "Salvando..." : "Salvar cliente"}
            </button>
          )}
        </div>
        {erroSalvar && (
          <p className="text-[12.5px] text-red-600 text-right mt-2">{erroSalvar}</p>
        )}
      </div>
    </div>
  );
}
