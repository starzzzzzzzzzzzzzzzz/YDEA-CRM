'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calcularPropostaSolar } from '@/lib/proposal-calculations';
import { criarProposta } from '@/lib/firebase/propostas';
import Step1Dados from '@/components/propostas/Step1Dados';
import Step2Dimensionamento from '@/components/propostas/Step2Dimensionamento';
import Step3DetalhesKit from '@/components/propostas/Step3DetalhesKit';
import Step4PosDimensionamento from '@/components/propostas/Step4PosDimensionamento';

export default function NovaPropostaPage() {
  const router = useRouter();
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nomeProjeto: '',
    clienteNome: '',
    clienteCpfCnpj: '',
    clienteEmail: '',
    clienteTelefone: '',
    consumoMensal: 5000,
    tipoFase: 'bifasico' as 'monofasico' | 'bifasico' | 'trifasico',
    irradiancia: 5.7885,
    taxaDesempenho: 0.75,
    potenciaModuloW: 650,
    areaModuloM2: 3.10,
    valorKitMaterial: 2798.05,
    valorComplementaresBase: 272.00,
    validadeDias: 7,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const calculos = calcularPropostaSolar({
        consumoMensal: formData.consumoMensal,
        tipoFase: formData.tipoFase,
        irradiancia: formData.irradiancia,
        taxaDesempenho: formData.taxaDesempenho,
        potenciaModuloW: formData.potenciaModuloW,
        areaModuloM2: formData.areaModuloM2,
        valorKitMaterial: formData.valorKitMaterial,
        valorComplementaresBase: formData.valorComplementaresBase,
      });

      const novaProposta = {
        status: 'rascunho' as const,
        nomeProjeto: formData.nomeProjeto || 'Projeto Solar',
        cliente: {
          nome: formData.clienteNome,
          cpfCnpj: formData.clienteCpfCnpj,
          email: formData.clienteEmail,
          telefone: formData.clienteTelefone,
        },
        dadosEntrada: {
          consumoMensal: formData.consumoMensal,
          tipoFase: formData.tipoFase,
          irradiancia: formData.irradiancia,
          taxaDesempenho: formData.taxaDesempenho,
          potenciaModuloW: formData.potenciaModuloW,
          areaModuloM2: formData.areaModuloM2,
          valorKitMaterial: formData.valorKitMaterial,
          valorComplementaresBase: formData.valorComplementaresBase,
        },
        calculos,
        validadeDias: formData.validadeDias,
        criadoEm: new Date().toISOString(),
      };

      const res = await criarProposta(novaProposta);
      if (res.success && res.id) {
        alert('Proposta gerada e salva com sucesso! 🚀');
        router.push(`/propostas/${res.id}`);
      } else {
        alert('Erro ao salvar proposta no banco.');
      }
    } catch (error) {
      console.error('Erro ao processar proposta:', error);
      alert('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Novo Gerador de Proposta Solar</h1>
        <p className="text-sm text-text-faint">Preencha o assistente abaixo para calcular e gerar o orçamento.</p>
      </div>

      {/* Barra de Progresso do Wizard com Suporte a Temas */}
      <div className="flex items-center justify-between bg-card-bg p-4 rounded-xl border border-border shadow-sm">
        <span className={`text-sm font-medium ${etapaAtual === 1 ? 'text-brand-strong font-bold' : 'text-text-faint'}`}>1. Dados</span>
        <span className="text-text-faint">&gt;</span>
        <span className={`text-sm font-medium ${etapaAtual === 2 ? 'text-brand-strong font-bold' : 'text-text-faint'}`}>2. Dimensionamento</span>
        <span className="text-text-faint">&gt;</span>
        <span className={`text-sm font-medium ${etapaAtual === 3 ? 'text-brand-strong font-bold' : 'text-text-faint'}`}>3. Kit & Custos</span>
        <span className="text-text-faint">&gt;</span>
        <span className={`text-sm font-medium ${etapaAtual === 4 ? 'text-brand-strong font-bold' : 'text-text-faint'}`}>4. Pós-Dimensionamento</span>
      </div>

      {/* Container dos Passos */}
      <div className="bg-card-bg p-6 rounded-xl border border-border shadow-sm">
        {etapaAtual === 1 && (
          <Step1Dados
            formData={formData}
            onChange={handleInputChange}
            onNext={() => setEtapaAtual(2)}
          />
        )}

        {etapaAtual === 2 && (
          <Step2Dimensionamento
            formData={formData}
            onChange={handleInputChange}
            onNext={() => setEtapaAtual(3)}
            onBack={() => setEtapaAtual(1)}
          />
        )}

        {etapaAtual === 3 && (
          <Step3DetalhesKit
            formData={formData}
            onChange={handleInputChange}
            onNext={() => setEtapaAtual(4)}
            onBack={() => setEtapaAtual(2)}
          />
        )}

        {etapaAtual === 4 && (
          <Step4PosDimensionamento
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onBack={() => setEtapaAtual(3)}
          />
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card-bg p-6 rounded-xl border border-border shadow-xl text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand mx-auto"></div>
            <p className="text-text-dark font-medium">Processando e salvando proposta...</p>
          </div>
        </div>
      )}
    </div>
  );
}