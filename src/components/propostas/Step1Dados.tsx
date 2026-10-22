'use client';

import React from 'react';

interface Step1Props {
  formData: {
    nomeProjeto: string;
    clienteNome: string;
    clienteCpfCnpj: string;
    clienteEmail: string;
    clienteTelefone: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
}

export default function Step1Dados({ formData, onChange, onNext }: Step1Props) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800">Etapa 1: Dados do Cliente e Projeto</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto / Usina</label>
          <input
            type="text"
            value={formData.nomeProjeto}
            onChange={(e) => onChange('nomeProjeto', e.target.value)}
            placeholder="Ex: Usina Residencial - Sr. João"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
          <input
            type="text"
            value={formData.clienteNome}
            onChange={(e) => onChange('clienteNome', e.target.value)}
            placeholder="Nome completo ou Razão Social"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
          <input
            type="text"
            value={formData.clienteCpfCnpj}
            onChange={(e) => onChange('clienteCpfCnpj', e.target.value)}
            placeholder="000.000.000-00"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            type="email"
            value={formData.clienteEmail}
            onChange={(e) => onChange('clienteEmail', e.target.value)}
            placeholder="cliente@email.com"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onNext}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Próximo: Dimensionamento &rarr;
        </button>
      </div>
    </div>
  );
}