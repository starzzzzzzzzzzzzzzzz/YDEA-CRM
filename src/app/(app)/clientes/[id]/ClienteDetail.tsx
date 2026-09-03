"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Zap,
  MessageCircle,
  FileText,
  Calendar,
  Wallet,
  DollarSign,
} from "lucide-react";
import {
  Cliente,
  CLIENTE_STATUS_STYLE,
  STATUS_LABEL,
  TIPO_PESSOA_LABEL,
  TEMPERATURA_LABEL,
} from "@/lib/types";

function formatData(iso?: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

type Tab = "geral" | "dados" | "energia" | "financeiro";

const TABS: { id: Tab; label: string }[] = [
  { id: "geral", label: "Visão geral" },
  { id: "dados", label: "Dados básicos" },
  { id: "energia", label: "Dados energéticos" },
  { id: "financeiro", label: "Financeiro" },
];

function Field({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-sm text-text-dark">{value || "—"}</div>
    </div>
  );
}

export default function ClienteDetail({ cliente }: { cliente: Cliente }) {
  const [tab, setTab] = useState<Tab>("geral");
  const documento = cliente.tipoPessoa === "PJ" ? cliente.cnpj : cliente.cpf;

  return (
    <div>
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-text-gray hover:text-text-dark mb-4 transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar para clientes
      </Link>

      <div className="rounded-xl border border-border bg-card-bg p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-brand-soft text-brand font-display font-bold text-lg flex items-center justify-center shrink-0">
              {cliente.nome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-semibold text-lg text-text-dark">
                  {cliente.nome}
                </h1>
                <span
                  className={`text-[11px] font-medium rounded px-2 py-1 ${CLIENTE_STATUS_STYLE[cliente.status]}`}
                >
                  {STATUS_LABEL[cliente.status]}
                </span>
              </div>
              {cliente.nomeFantasia && (
                <div className="text-sm text-text-faint">{cliente.nomeFantasia}</div>
              )}
              <div className="text-xs text-text-faint font-mono mt-1">
                {cliente.codigo} · {TIPO_PESSOA_LABEL[cliente.tipoPessoa]}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-border text-text-gray font-semibold text-sm px-3.5 py-2 hover:bg-panel-bg transition-colors">
              <MessageCircle size={15} />
              WhatsApp
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-border text-text-gray font-semibold text-sm px-3.5 py-2 hover:bg-panel-bg transition-colors">
              <Mail size={15} />
              Email
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors">
              <FileText size={15} />
              Nova proposta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border-soft">
          <div>
            <div className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-1">
              Temperatura
            </div>
            <div className="text-sm font-semibold text-text-dark">
              {TEMPERATURA_LABEL[cliente.temperatura]}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-1">
              Score
            </div>
            <div className="text-sm font-semibold text-text-dark">{cliente.score ?? "—"}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-1">
              Responsável
            </div>
            <div className="text-sm font-semibold text-text-dark">{cliente.responsavel}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-1">
              Cliente desde
            </div>
            <div className="text-sm font-semibold text-text-dark">
              {formatData(cliente.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-brand text-brand"
                : "border-transparent text-text-gray hover:text-text-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "geral" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card-bg p-5">
            <h2 className="font-display font-semibold text-sm text-text-dark mb-4">
              Contato e endereço
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone" value={cliente.telefone} />
              <Field label="WhatsApp" value={cliente.whatsapp} />
              <Field label="Email" value={cliente.email} />
              <Field label="Origem" value={cliente.origem} />
              <Field
                label="Endereço"
                value={[cliente.endereco, cliente.numero].filter(Boolean).join(", ")}
              />
              <Field label="Cidade/UF" value={`${cliente.cidade}/${cliente.estado}`} />
            </div>
            {cliente.observacoes && (
              <div className="mt-5 pt-4 border-t border-border-soft">
                <div className="text-[11px] font-semibold text-text-faint uppercase tracking-wide mb-1.5">
                  Observações
                </div>
                <p className="text-sm text-text-gray">{cliente.observacoes}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card-bg p-5">
            <h2 className="font-display font-semibold text-sm text-text-dark mb-4">
              Relacionamento
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-brand-soft text-brand text-xs font-bold flex items-center justify-center">
                  {cliente.responsavel.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-dark">
                    {cliente.responsavel}
                  </div>
                  <div className="text-xs text-text-faint">Responsável</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-text-gray">
                <Calendar size={15} className="text-text-faint shrink-0" />
                Cadastrado em {formatData(cliente.createdAt)}
              </div>
              {cliente.canal && (
                <div className="flex items-center gap-2.5 text-sm text-text-gray">
                  <MapPin size={15} className="text-text-faint shrink-0" />
                  Canal: {cliente.canal}
                </div>
              )}
              {cliente.score !== undefined && (
                <div className="flex items-center gap-2.5 text-sm text-text-gray">
                  <Wallet size={15} className="text-text-faint shrink-0" />
                  Score: <span className="font-semibold text-text-dark">{cliente.score}</span>
                </div>
              )}
              {cliente.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {cliente.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 bg-panel-bg text-text-gray"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "dados" && (
        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="font-display font-semibold text-sm text-text-dark mb-4">
            Dados cadastrais
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Tipo de pessoa" value={TIPO_PESSOA_LABEL[cliente.tipoPessoa]} />
            <Field
              label={cliente.tipoPessoa === "PF" ? "Nome completo" : "Razão social"}
              value={cliente.tipoPessoa === "PJ" ? cliente.razaoSocial || cliente.nome : cliente.nome}
            />
            {cliente.nomeFantasia && <Field label="Nome fantasia" value={cliente.nomeFantasia} />}
            <Field label={cliente.tipoPessoa === "PF" ? "CPF" : "CNPJ"} value={documento} />
            {cliente.rg && <Field label="RG" value={cliente.rg} />}
            {cliente.inscricaoEstadual && (
              <Field label="Inscrição estadual" value={cliente.inscricaoEstadual} />
            )}
            {cliente.dataNascimento && (
              <Field label="Data de nascimento" value={formatData(cliente.dataNascimento)} />
            )}
            <Field label="CEP" value={cliente.cep} />
            <Field
              label="Endereço"
              value={[cliente.endereco, cliente.numero].filter(Boolean).join(", ")}
            />
            <Field label="Complemento" value={cliente.complemento} />
            <Field label="Bairro" value={cliente.bairro} />
            <Field label="Cidade" value={cliente.cidade} />
            <Field label="Estado" value={cliente.estado} />
          </div>
        </div>
      )}

      {tab === "energia" && (
        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="font-display font-semibold text-sm text-text-dark mb-4 flex items-center gap-2">
            <Zap size={16} className="text-brand" />
            Dados energéticos
          </h2>
          {cliente.distribuidora || cliente.unidadeConsumidora || cliente.consumoMedio ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Distribuidora" value={cliente.distribuidora} />
              <Field label="Unidade consumidora" value={cliente.unidadeConsumidora} />
              <Field label="Classe consumidora" value={cliente.classeConsumidora} />
              <Field label="Grupo tarifário" value={cliente.grupoTarifario} />
              <Field
                label="Consumo médio"
                value={cliente.consumoMedio ? `${cliente.consumoMedio} kWh` : undefined}
              />
              <Field label="Tipo de ligação" value={cliente.tipoLigacao} />
            </div>
          ) : (
            <p className="text-sm text-text-faint">Nenhum dado energético cadastrado ainda.</p>
          )}
        </div>
      )}

      {tab === "financeiro" && (
        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="font-display font-semibold text-sm text-text-dark mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-brand" />
            Dados financeiros
          </h2>
          {cliente.formaPagamento || cliente.condicaoPagamento ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Forma de pagamento" value={cliente.formaPagamento} />
              <Field label="Condição de pagamento" value={cliente.condicaoPagamento} />
            </div>
          ) : (
            <p className="text-sm text-text-faint">Nenhum dado financeiro cadastrado ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}
