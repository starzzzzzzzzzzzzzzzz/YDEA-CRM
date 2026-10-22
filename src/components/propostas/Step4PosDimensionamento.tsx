'use client';

import React from 'react';

interface Step4Props {
  formData: {
    validadeDias: number;
  };
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function Step4PosDimensionamento({ formData, onChange, onSubmit, onBack }: Step4Props) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800">Etapa 4: Pós-dimensionamento e Validade</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Validade da Proposta (Dias)</label>
          <input
            type="number"
            value={formData.validadeDias}
            onChange={(e) => onChange('validadeDias', Number(e.target.value))}
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Padrão: 7 dias para evitar propostas vencidas.</p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-800">
          💡 Tudo pronto! Ao avançar, o motor calculará automaticamente a potência, módulos, impostos via gross-up e a proposta estará pronta para gerar o documento.
        </p>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          &larr; Voltar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
        >
          Gerar Proposta Solar 🚀
        </button>
      </div>
    </div>
  );
}