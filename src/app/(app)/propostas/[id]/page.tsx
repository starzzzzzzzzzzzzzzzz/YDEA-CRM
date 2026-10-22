'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { buscarPropostaPorId } from '@/lib/firebase/propostas';
import { PropostaSolar } from '@/lib/types';
import { ArrowLeft, Printer, Share2, CheckCircle2 } from 'lucide-react';

export default function DetalhesPropostaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [proposta, setProposta] = useState<PropostaSolar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      try {
        const dados = await buscarPropostaPorId(id);
        setProposta(dados);
      } catch (error) {
        console.error('Erro ao carregar proposta:', error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 text-center bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Proposta não encontrada</h2>
        <p className="text-gray-500 mb-4">A proposta solicitada não existe ou foi removida.</p>
        <button
          onClick={() => router.push('/propostas/novo')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          Criar Nova Proposta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Barra de Ações Superior */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            <Printer size={18} /> Imprimir / PDF
          </button>
          <button
            onClick={() => alert('Link copiado com sucesso!')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <Share2 size={18} /> Compartilhar
          </button>
        </div>
      </div>

      {/* Documento da Proposta (Área de Impressão) */}
      <div className="bg-white p-8 rounded-lg shadow-sm border space-y-8 print:shadow-none print:border-none">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{proposta.nomeProjeto}</h1>
            <p className="text-sm text-gray-500">Emitida em: {new Date(proposta.criadoEm).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 size={16} /> Status: {proposta.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</h3>
            <p className="text-gray-800 font-medium">{proposta.cliente.nome}</p>
            <p className="text-sm text-gray-600">CPF/CNPJ: {proposta.cliente.cpfCnpj}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contato</h3>
            <p className="text-sm text-gray-600">E-mail: {proposta.cliente.email || 'Não informado'}</p>
            <p className="text-sm text-gray-600">Telefone: {proposta.cliente.telefone || 'Não informado'}</p>
          </div>
        </div>

        {/* Resumo Técnico */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">Dimensionamento do Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <span className="text-xs text-blue-600 font-medium">Potência Real (kWp)</span>
              <p className="text-xl font-bold text-blue-900">{proposta.calculos.kwpReal} kWp</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <span className="text-xs text-blue-600 font-medium">Qtd. Módulos</span>
              <p className="text-xl font-bold text-blue-900">{proposta.calculos.qtdModulos} un.</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <span className="text-xs text-blue-600 font-medium">Área Estimada</span>
              <p className="text-xl font-bold text-blue-900">{proposta.calculos.areaEstimada} m²</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <span className="text-xs text-blue-600 font-medium">Geração Média</span>
              <p className="text-xl font-bold text-blue-900">{proposta.calculos.geracaoEspecifica} kWh/mês</p>
            </div>
          </div>
        </div>

        {/* Valores Comerciais */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Investimento e Condições</h3>
          <div className="bg-gray-50 p-6 rounded-lg border space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Preço por kWp:</span>
              <span className="font-medium">R$ {proposta.calculos.precoPorKwp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Validade da Proposta:</span>
              <span className="font-medium">{proposta.validadeDias} dias</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Valor Total do Projeto:</span>
              <span className="text-2xl font-extrabold text-green-600">
                R$ {proposta.calculos.valorTotalProposta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}