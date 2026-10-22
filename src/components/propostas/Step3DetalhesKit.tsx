'use client';

import React from 'react';

interface Step3DetalhesKitProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step3DetalhesKit({ formData, updateFormData, onNext, onPrev }: Step3DetalhesKitProps) {
  // Valores padrão ou vindos do formData
  const itensComplementares = formData.itensComplementares || [
    { nome: 'ART', operacao: 'Valor fixo', valorUnitario: 272.00, quantidade: 1, aliquotaImposto: 0.1358 },
    { nome: 'Deslocamento', operacao: 'Personalizado', valorUnitario: 1.03, quantidade: 1, aliquotaImposto: 0.1358 },
    { nome: 'Instalação', operacao: 'Personalizado', valorUnitario: 4640.00, quantidade: 1, aliquotaImposto: 0.1358 },
    { nome: 'Material CA', operacao: 'Personalizado', valorUnitario: 500.00, quantidade: 1, aliquotaImposto: 0.1358 },
  ];

  const handleItemChange = (index: number, field: string, value: any) => {
    const novosItens = [...itensComplementares];
    novosItens[index] = { ...novosItens[index], [field]: value };
    updateFormData({ itensComplementares: novosItens });
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-xl font-semibold">Detalhes do Kit e Itens Complementares</h2>
        <p className="text-sm text-slate-400">Gerencie os custos adicionais, taxas, mão de obra e margens do projeto.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3">Item</th>
              <th className="pb-3">Operação</th>
              <th className="pb-3">Quantidade</th>
              <th className="pb-3">Valor Unitário (R$)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {itensComplementares.map((item: any, index: number) => (
              <tr key={index}>
                <td className="py-3 font-medium">{item.nome}</td>
                <td className="py-3 text-slate-400">{item.operacao}</td>
                <td className="py-3">
                  <input
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => handleItemChange(index, 'quantidade', Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-20 text-white"
                  />
                </td>
                <td className="py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={item.valorUnitario}
                    onChange={(e) => handleItemChange(index, 'valorUnitario', Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-32 text-white"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
        >
          Prosseguir
        </button>
      </div>
    </div>
  );
}