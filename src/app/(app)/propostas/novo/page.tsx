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

  // Estado unificado do formulário
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
      // 1. Executa o motor de cálculo matemático
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

      // 2. Monta o objeto final da proposta
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

      // 3. Salva no Firestore
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
        <h1 className="text-2xl font-bold text-gray-900">Novo Gerador de Proposta Solar</h1>
        <p className="text-sm text-gray-500">Preencha o assistente abaixo para calcular e gerar o orçamento.</p>
      </div>

      {/* Barra de Progresso das Etapas */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <span className={`text-sm font-medium ${etapaAtual === 1 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>1. Dados</span>
        <span className="text-gray-300">&gt;</span>
        <span className={`text-sm font-medium ${etapaAtual === 2 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>2. Dimensionamento</span>
        <span className="text-gray-300">&gt;</span>
        <span className={`text-sm font-medium ${etapaAtual === 3 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>3. Kit & Custos</span>
        <span className="text-gray-300">&gt;</span>
        <span className={`text-sm font-medium ${etapaAtual === 4 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>4. Pós-Dimensionamento</span>
      </div>

      {/* Renderização condicional dos passos */}
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

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-700 font-medium">Processando e salvando proposta...</p>
          </div>
        </div>
      )}
    </div>
  );
}