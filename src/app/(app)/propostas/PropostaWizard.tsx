"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { createProposta, fetchProposta, updateProposta } from "@/lib/firebase/propostas";
import { dadosIniciais } from "@/lib/propostas/dados-iniciais";
import { calcularProposta } from "@/lib/propostas/proposal-calculations";
import { formatarBRL, formatarNumero } from "@/lib/propostas/proposal-text";
import { ETAPAS_PROPOSTA, validarEtapa } from "@/lib/propostas/validacao";
import type { PropostaDados, PropostaSalva, PropostaStatus } from "@/lib/propostas/types";
import Etapa1Dados from "./etapas/Etapa1Dados";
import Etapa2Dimensionamento from "./etapas/Etapa2Dimensionamento";
import Etapa3Detalhes from "./etapas/Etapa3Detalhes";
import Etapa4Pos from "./etapas/Etapa4Pos";
import DocumentoViewer from "./DocumentoViewer";

const btnPrimario =
  "flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
const btnSecundario =
  "flex items-center gap-1.5 rounded-lg border border-border text-text-gray font-semibold text-sm px-4 py-2 hover:bg-panel-bg transition-colors disabled:opacity-60";

export default function PropostaWizard({ dealId, clienteId, propostaId }: { dealId?: string; clienteId?: string; propostaId?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { currentUser, deals, dealsLoading, getOrganizacao, getPessoa, clientes, clientesLoading } = useCrmData();

  const [dados, setDados] = useState<PropostaDados | null>(null);
  const [salva, setSalva] = useState<PropostaSalva | null>(null);
  const [etapa, setEtapa] = useState(0);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  // Abre uma proposta existente...
  useEffect(() => {
    if (!propostaId || dados) return;
    let cancelado = false;
    fetchProposta(propostaId)
      .then((p) => {
        if (cancelado) return;
        if (!p) {
          showToast("Proposta não encontrada", "error");
          router.replace("/propostas");
          return;
        }
        setSalva(p);
        setDados(p.dados);
      })
      .catch(() => showToast("Erro ao carregar a proposta", "error"));
    return () => {
      cancelado = true;
    };
  }, [propostaId, dados, router, showToast]);

  // ...ou começa uma nova, já preenchida com o que o negócio/cadastro tem.
  useEffect(() => {
    if (propostaId || dados) return;
    if ((dealId && dealsLoading) || ((dealId || clienteId) && clientesLoading)) return;
    const deal = dealId ? deals.find((d) => d.id === dealId) : undefined;
    const nomeDoNegocio = deal ? (getOrganizacao(deal.organizacaoId)?.nome ?? getPessoa(deal.pessoaId)?.nome) : undefined;
    const cliente = clienteId
      ? clientes.find((c) => c.id === clienteId)
      : nomeDoNegocio
        ? clientes.find((c) => c.nome === nomeDoNegocio)
        : undefined;
    setDados(
      dadosIniciais({
        usuario: currentUser,
        deal,
        organizacao: getOrganizacao(deal?.organizacaoId),
        pessoa: getPessoa(deal?.pessoaId),
        cliente,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propostaId, dealId, clienteId, dealsLoading, clientesLoading, dados]);

  const set = useCallback(<K extends keyof PropostaDados>(campo: K, valor: PropostaDados[K]) => {
    setDados((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setErros((prev) => {
      if (!(campo in prev)) return prev;
      const resto = { ...prev };
      delete resto[campo as string];
      return resto;
    });
  }, []);

  const resultado = useMemo(() => (dados ? calcularProposta(dados) : null), [dados]);

  async function salvar(status: PropostaStatus): Promise<PropostaSalva | null> {
    if (!dados || !resultado) return null;
    try {
      if (salva) {
        await updateProposta(salva.id, { dados, valorTotal: resultado.valorTotal, potenciaKwp: resultado.potenciaRealKwp, status });
        const atualizada: PropostaSalva = { ...salva, dados, status, valorTotal: resultado.valorTotal, potenciaKwp: resultado.potenciaRealKwp, clienteNome: dados.clienteNome, nomeProjeto: dados.nomeProjeto };
        setSalva(atualizada);
        return atualizada;
      }
      const nova = await createProposta({
        dados,
        valorTotal: resultado.valorTotal,
        potenciaKwp: resultado.potenciaRealKwp,
        status,
        usuarioId: currentUser.id,
        usuarioNome: [currentUser.nome, currentUser.sobrenome].filter(Boolean).join(" "),
      });
      setSalva(nova);
      return nova;
    } catch (err) {
      console.error("Erro ao salvar proposta:", err);
      showToast("Erro ao salvar a proposta", "error");
      return null;
    }
  }

  async function prosseguir() {
    if (!dados) return;
    const e = validarEtapa(dados, etapa);
    setErros(e);
    if (Object.keys(e).length > 0) {
      showToast("Revise os campos destacados", "error");
      return;
    }
    setSalvando(true);
    const ok = await salvar("rascunho");
    setSalvando(false);
    if (ok) setEtapa((n) => Math.min(n + 1, ETAPAS_PROPOSTA.length - 1));
  }

  async function finalizar() {
    setSalvando(true);
    const ok = await salvar("finalizada");
    setSalvando(false);
    if (ok) {
      showToast("Proposta finalizada");
      router.push(`/propostas/${ok.id}`);
    }
  }

  if (!dados || !resultado) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const ultima = etapa === ETAPAS_PROPOSTA.length - 1;

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-semibold text-xl text-text-dark">
            {salva ? `Proposta nº ${salva.numero}` : "Nova proposta"}
          </h1>
          <p className="text-[12.5px] text-text-faint">
            {formatarNumero(resultado.potenciaRealKwp)} kWp · {resultado.quantidadeModulos} módulos · {formatarBRL(resultado.valorTotal)}
          </p>
        </div>
        <button type="button" className={btnSecundario} onClick={() => router.push("/propostas")}>
          Cancelar
        </button>
      </div>

      <ol className="flex flex-wrap gap-2 mb-6">
        {ETAPAS_PROPOSTA.map((nome, i) => {
          const feita = i < etapa;
          const atual = i === etapa;
          return (
            <li key={nome}>
              <button
                type="button"
                // volta livremente; avançar só pelo "Prosseguir", que valida a etapa
                disabled={i > etapa}
                onClick={() => setEtapa(i)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  atual
                    ? "border-brand bg-brand-soft text-text-dark"
                    : feita
                      ? "border-border text-text-dark hover:bg-panel-bg"
                      : "border-border text-text-faint cursor-not-allowed"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${feita ? "bg-brand text-text-dark" : "bg-panel-bg"}`}>
                  {feita ? <Check size={12} /> : i + 1}
                </span>
                {nome}
              </button>
            </li>
          );
        })}
      </ol>

      {etapa === 0 && <Etapa1Dados dados={dados} set={set} erros={erros} />}
      {etapa === 1 && <Etapa2Dimensionamento dados={dados} set={set} erros={erros} />}
      {etapa === 2 && <Etapa3Detalhes dados={dados} set={set} erros={erros} />}
      {etapa === 3 && <Etapa4Pos dados={dados} set={set} erros={erros} />}
      {etapa === 4 && <DocumentoViewer dados={dados} salva={salva} />}

      <div className="flex items-center justify-end gap-3 mt-6">
        {etapa > 0 && (
          <button type="button" className={btnSecundario} disabled={salvando} onClick={() => setEtapa((n) => n - 1)}>
            <ChevronLeft size={15} /> Voltar
          </button>
        )}
        {ultima ? (
          <button type="button" className={btnPrimario} disabled={salvando} onClick={finalizar}>
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Finalizar
          </button>
        ) : (
          <button type="button" className={btnPrimario} disabled={salvando} onClick={prosseguir}>
            {salvando ? <Loader2 size={15} className="animate-spin" /> : null}
            Prosseguir <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
