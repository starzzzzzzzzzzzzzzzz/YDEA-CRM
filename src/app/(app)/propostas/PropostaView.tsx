"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { fetchProposta } from "@/lib/firebase/propostas";
import type { PropostaSalva } from "@/lib/propostas/types";
import DocumentoViewer from "./DocumentoViewer";

/** Proposta já salva: mostra e imprime os três documentos. A edição reabre o wizard. */
export default function PropostaView({ id }: { id: string }) {
  const [proposta, setProposta] = useState<PropostaSalva | null>(null);
  const [estado, setEstado] = useState<"carregando" | "ok" | "naoEncontrada" | "erro">("carregando");

  useEffect(() => {
    let cancelado = false;
    fetchProposta(id)
      .then((p) => {
        if (cancelado) return;
        setProposta(p);
        setEstado(p ? "ok" : "naoEncontrada");
      })
      .catch(() => !cancelado && setEstado("erro"));
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (estado === "carregando") {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }
  if (estado !== "ok" || !proposta) {
    return (
      <div className="py-24 text-center text-sm text-text-gray">
        {estado === "erro" ? "Não foi possível carregar a proposta." : "Proposta não encontrada."}{" "}
        <Link href="/propostas" className="text-brand-strong underline">
          Voltar para propostas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <Link href="/propostas" className="flex items-center gap-1 text-[12.5px] text-text-faint hover:text-text-gray mb-1">
            <ArrowLeft size={13} /> Propostas
          </Link>
          <h1 className="font-display font-semibold text-xl text-text-dark">
            Proposta nº {proposta.numero} — {proposta.clienteNome}
          </h1>
        </div>
        <Link
          href={`/propostas/nova?id=${proposta.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-border text-text-gray font-semibold text-sm px-3.5 py-2 hover:bg-panel-bg transition-colors"
        >
          <Pencil size={14} /> Editar
        </Link>
      </div>
      <DocumentoViewer dados={proposta.dados} salva={proposta} />
    </div>
  );
}
