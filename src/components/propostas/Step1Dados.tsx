'use client';

import React from 'react';

interface Step1Props {
  formData: any;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
}

export default function Step1Dados({ formData, onChange, onNext }: Step1Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-text-dark">Etapa 1: Dados do Cliente e Projeto</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-gray mb-1">Nome do Projeto / Usina</label>
          <input
            type="text"
            value={formData.nomeProjeto}
            onChange={(e) => onChange('nomeProjeto', e.target.value)}
            placeholder="Ex: Usina Residencial - Sr. João"
            className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-sm text-text-dark outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-gray mb-1">Nome do Cliente</label>
          <input
            type="text"
            value={formData.clienteNome}
            onChange={(e) => onChange('clienteNome', e.target.value)}
            placeholder="Nome completo ou Razão Social"
            className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-sm text-text-dark outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-gray mb-1">CPF / CNPJ</label>
          <input
            type="text"
            value={formData.clienteCpfCnpj}
            onChange={(e) => onChange('clienteCpfCnpj', e.target.value)}
            placeholder="000.000.000-00"
            className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-sm text-text-dark outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-gray mb-1">E-mail</label>
          <input
            type="email"
            value={formData.clienteEmail}
            onChange={(e) => onChange('clienteEmail', e.target.value)}
            placeholder="cliente@email.com"
            className="w-full rounded-lg border border-border bg-panel-bg px-3 py-2 text-sm text-text-dark outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <button
          type="button"
          onClick={onNext}
          className="bg-brand text-text-dark font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-strong transition shadow-sm"
        >
          Próximo: Dimensionamento &rarr;
        </button>
      </div>
    </div>
  );
}