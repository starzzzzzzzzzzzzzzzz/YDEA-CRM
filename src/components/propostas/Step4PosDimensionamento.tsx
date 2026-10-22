'use client';

import React from 'react';

interface Step4PosDimensionamentoProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step4PosDimensionamento({ formData, updateFormData, onNext, onPrev }: Step4PosDimensionamentoProps) {
  const handleChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-xl font-semibold">Dados Pós-Dimensionamento & Contrato</h2>
        <p className="text-sm text-slate-400">Preencha as informações da Ordem de Serviço e as cláusulas contratuais da proposta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Data Início OS</label>
          <input
            type="date"
            value={formData.dataInicioOS || ''}
            onChange={(e) => handleChange('dataInicioOS', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Data Fim OS</label>
          <input
            type="date"
            value={formData.dataFimOS || ''}
            onChange={(e) => handleChange('dataFimOS', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Número OS</label>
          <input
            type="text"
            placeholder="Campo numérico"
            value={formData.numeroOS || ''}
            onChange={(e) => handleChange('numeroOS', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Colaborador Responsável OS</label>
          <input
            type="text"
            placeholder="Nome do colaborador"
            value={formData.colaboradorOS || ''}
            onChange={(e) => handleChange('colaboradorOS', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">CPF Colaborador Responsável OS</label>
          <input
            type="text"
            placeholder="000.000.000-00"
            value={formData.cpfColaboradorOS || ''}
            onChange={(e) => handleChange('cpfColaboradorOS', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Nacionalidade</label>
          <input
            type="text"
            value={formData.nacionalidade || 'Brasileiro(a)'}
            onChange={(e) => handleChange('nacionalidade', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Cláusula 2.1.1</label>
          <textarea
            rows={3}
            value={formData.clausula211 || 'Pagamento no valor de R$ 00000 (VALOR POR ESCRITO) à vista, através de FORMA DE PAGAMENTO, como entrada.'}
            onChange={(e) => handleChange('clausula211', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Cláusula 2.1.2</label>
          <textarea
            rows={3}
            value={formData.clausula212 || 'Pagamento no valor de R$ 00000 (VALOR POR ESCRITO) através de FORMA DE PAGAMENTO, na instalação do sistema fotovoltaico.'}
            onChange={(e) => handleChange('clausula212', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm"
          />
        </div>
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