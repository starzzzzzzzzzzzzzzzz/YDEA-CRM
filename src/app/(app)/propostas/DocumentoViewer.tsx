"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Printer } from "lucide-react";
import { inputClass } from "@/components/ui/Field";
import { temPlaceholderPendente } from "@/lib/propostas/proposal-text";
import type { PropostaDados, PropostaSalva } from "@/lib/propostas/types";
import DocumentoProposta from "./documentos/DocumentoProposta";
import DocumentoContrato from "./documentos/DocumentoContrato";
import DocumentoOS from "./documentos/DocumentoOS";
import { contextoDocumento } from "./documentos/dados-documento";
import { CONTRATO_TEXTO_REVISADO } from "./documentos/contrato-clausulas";

type Tipo = "proposta" | "contrato" | "os";

const OPCOES: { id: Tipo; label: string; paginas: number }[] = [
  { id: "proposta", label: "Proposta comercial", paginas: 8 },
  { id: "contrato", label: "Contrato comercial", paginas: 7 },
  { id: "os", label: "Ordem de serviço", paginas: 2 },
];

/** Pré-visualização + impressão (Salvar como PDF) dos três documentos, todos calculados da mesma fonte. */
export default function DocumentoViewer({ dados, salva }: { dados: PropostaDados; salva?: PropostaSalva | null }) {
  const [tipo, setTipo] = useState<Tipo>("proposta");
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const ctx = useMemo(() => contextoDocumento(dados, salva), [dados, salva]);

  const bloqueios: string[] = [];
  if (tipo === "contrato") {
    if (!CONTRATO_TEXTO_REVISADO) {
      bloqueios.push("As cláusulas gerais do contrato são um texto provisório. Troque pelo modelo jurídico da Ydea em contrato-clausulas.ts e ative CONTRATO_TEXTO_REVISADO.");
    }
    if (temPlaceholderPendente(dados.clausula211) || temPlaceholderPendente(dados.clausula212)) {
      bloqueios.push("Preencha as cláusulas 2.1.1 e 2.1.2 na etapa Pós-dimensionamento (ainda têm marcadores do modelo).");
    }
  }

  const documento =
    tipo === "proposta" ? <DocumentoProposta ctx={ctx} /> : tipo === "contrato" ? <DocumentoContrato ctx={ctx} /> : <DocumentoOS ctx={ctx} />;

  return (
    <div>
      <div className="no-print flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-[13px] text-text-gray">
          Documento
          <select className={`${inputClass} !w-auto`} value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)}>
            {OPCOES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} ({o.paginas} págs.)
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={bloqueios.length > 0}
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-3.5 py-2 hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer size={15} />
          Imprimir / Salvar PDF
        </button>
      </div>

      {bloqueios.length > 0 && (
        <div className="no-print mb-4 space-y-2">
          {bloqueios.map((b) => (
            <div key={b} className="flex items-start gap-2 rounded-lg border border-badge-amber-text/40 bg-badge-amber-bg p-3 text-[12.5px] text-badge-amber-text">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {b}
            </div>
          ))}
        </div>
      )}

      <div className="no-print overflow-auto rounded-xl bg-panel-bg border border-border p-4">{documento}</div>

      {montado && createPortal(<div className="doc-print-root">{documento}</div>, document.body)}
    </div>
  );
}
