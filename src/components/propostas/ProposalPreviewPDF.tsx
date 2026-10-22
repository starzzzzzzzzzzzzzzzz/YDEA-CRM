'use client';

import React, { useState } from 'react';

interface ProposalPreviewPDFProps {
  formData: any;
  onPrev: () => void;
  onFinalize: () => void;
}

export default function ProposalPreviewPDF({ formData, onPrev, onFinalize }: ProposalPreviewPDFProps) {
  const [templateSelecionado, setTemplateSelecionado] = useState('PROPOSTA COMERCIAL');

  const templatesDisponiveis = [
    'MONITORAMENTO',
    'MANUTENÇÃO',
    'LIMPEZA',
    'PROPOSTA COMERCIAL',
    'PROPOSTA COMERCIAL 2',
    'Ordem de Serviço',
    'Contrato Comercial',
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-xl font-semibold">Proposta e Geração de PDF</h2>
        <p className="text-sm text-slate-400">Selecione o template desejado e revise os dados antes de finalizar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna de Configuração / Seleção de Template */}
        <div className="space-y-4 bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Template da proposta:</label>
            <select
              value={templateSelecionado}
              onChange={(e) => setTemplateSelecionado(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
            >
              {templatesDisponiveis.map((tmpl) => (
                <option key={tmpl} value={tmpl}>
                  {tmpl}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-800/50 rounded border border-slate-700/50 space-y-2">
            <h3 className="text-xs font-semibold uppercase text-slate-400">Resumo do Cliente</h3>
            <p className="text-sm font-medium text-white">{formData.nomeCliente || 'Card Modelo'}</p>
            <p className="text-xs text-slate-400">Projeto: {formData.nomeProjeto || 'Teste Gerador'}</p>
            <p className="text-lg font-bold text-blue-400">
              R$ {formData.valorTotalProposta ? formData.valorTotalProposta.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '10.977,77'}
            </p>
          </div>
        </div>

        {/* Coluna de Visualização do PDF */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-lg flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-4 text-2xl">
            📄
          </div>
          <h3 className="text-lg font-medium text-white mb-1">Visualização do Documento ({templateSelecionado})</h3>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            O documento está pronto para ser gerado e processado com base nos parâmetros configurados nos passos anteriores.
          </p>
          <div className="inline-block px-4 py-2 bg-slate-800 text-xs font-mono text-slate-300 rounded border border-slate-700">
            Status: Pronto para finalizar
          </div>
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
          onClick={onFinalize}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition"
        >
          Finalizar e Salvar Proposta
        </button>
      </div>
    </div>
  );
}