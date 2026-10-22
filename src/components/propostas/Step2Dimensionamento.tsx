'use client';

import React from 'react';

interface Step2Props {
  formData: {
    consumoMensal: number;
    tipoFase: 'monofasico' | 'bifasico' | 'trifasico';
    irradiancia: number;
    taxaDesempenho: number;
  };
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Dimensionamento({ formData, onChange, onNext, onBack }: Step2Props) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800">Etapa 2: Dimensionamento Técnico e Fatura</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Consumo Médio Mensal (kWh)</label>
          <input
            type="number"
            value={formData.consumoMensal || ''}
            onChange={(e) => onChange('consumoMensal', Number(e.target.value))}
            placeholder="Ex: 5000"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Fase (Rede)</label>
          <select
            value={formData.tipoFase}
            onChange={(e) => onChange('tipoFase', e.target.value)}
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="monofasico">Monofásico (Custo disp.: 30 kWh)</option>
            <option value="bifasico">Bifásico (Custo disp.: 50 kWh)</option>
            <option value="trifasico">Trifásico (Custo disp.: 100 kWh)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Irradiação Local (kWh/m²·dia)</label>
          <input
            type="number"
            step="0.0001"
            value={formData.irradiancia}
            onChange={(e) => onChange('irradiancia', Number(e.target.value))}
            placeholder="Ex: 5.7885"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Desempenho (PR)</label>
          <input
            type="number"
            step="0.01"
            value={formData.taxaDesempenho}
            onChange={(e) => onChange('taxaDesempenho', Number(e.target.value))}
            placeholder="Ex: 0.75"
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
          Próximo: Seleção do Kit &rarr;
        </button>
      </div>
    </div>
  );
}   