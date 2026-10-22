'use client';

import React from 'react';

interface Step3Props {
  formData: {
    potenciaModuloW: number;
    areaModuloM2: number;
    valorKitMaterial: number;
    valorComplementaresBase: number;
  };
  onChange: (field: string, value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3DetalhesKit({ formData, onChange, onNext, onBack }: Step3Props) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800">Etapa 3: Detalhes do Kit e Custos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Potência do Módulo (W)</label>
          <input
            type="number"
            value={formData.potenciaModuloW || ''}
            onChange={(e) => onChange('potenciaModuloW', Number(e.target.value))}
            placeholder="Ex: 650"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Área Unitária do Módulo (m²)</label>
          <input
            type="number"
            step="0.01"
            value={formData.areaModuloM2 || ''}
            onChange={(e) => onChange('areaModuloM2', Number(e.target.value))}
            placeholder="Ex: 3.10"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Material do Kit (R$)</label>
          <input
            type="number"
            step="0.01"
            value={formData.valorKitMaterial || ''}
            onChange={(e) => onChange('valorKitMaterial', Number(e.target.value))}
            placeholder="Ex: 2798.05"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor Base dos Itens Complementares (R$)</label>
          <input
            type="number"
            step="0.01"
            value={formData.valorComplementaresBase || ''}
            onChange={(e) => onChange('valorComplementaresBase', Number(e.target.value))}
            placeholder="Ex: 272.00"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
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
          onClick={onNext}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Próximo: Pós-dimensionamento &rarr;
        </button>
      </div>
    </div>
  );
}