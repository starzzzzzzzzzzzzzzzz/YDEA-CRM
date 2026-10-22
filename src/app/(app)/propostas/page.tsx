'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PropostaSolar } from '@/lib/types';
import { Plus, FileText, ArrowRight, Calendar, DollarSign, User } from 'lucide-react';

export default function ListaPropostasPage() {
  const router = useRouter();
  const [propostas, setPropostas] = useState<PropostaSolar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPropostas() {
      try {
        const q = query(collection(db, 'propostas_solares'), orderBy('criadoEm', 'desc'));
        const querySnapshot = await getDocs(q);
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PropostaSolar[];
        setPropostas(lista);
      } catch (error) {
        console.error('Erro ao carregar propostas:', error);
      } finally {
        setLoading(false);
      }
    }
    carregarPropostas();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propostas Solares</h1>
          <p className="text-sm text-gray-500">Gerencie todos os orçamentos e dimensionamentos criados.</p>
        </div>
        <button
          onClick={() => router.push('/propostas/novo')}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} /> Nova Proposta Solar
        </button>
      </div>

      {/* Lista ou Estado Vazio */}
      {propostas.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border text-center space-y-3">
          <FileText size={48} className="mx-auto text-gray-300" />
          <h3 className="text-lg font-bold text-gray-800">Nenhuma proposta encontrada</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Ainda não há propostas geradas no sistema. Clique no botão acima para criar a primeira.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propostas.map((prop) => (
            <div
              key={prop.id}
              onClick={() => router.push(`/propostas/${prop.id}`)}
              className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {prop.status}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(prop.criadoEm).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">
                  {prop.nomeProjeto}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <User size={14} className="text-gray-400" /> {prop.cliente.nome}
                </p>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Valor Total</span>
                  <span className="font-bold text-green-600 text-lg flex items-center">
                    <DollarSign size={16} />
                    {prop.calculos.valorTotalProposta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="text-blue-600 group-hover:translate-x-1 transition flex items-center gap-1 text-sm font-medium">
                  Ver <ArrowRight size={16} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}