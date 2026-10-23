"use client";

import { AlertTriangle } from "lucide-react";
import { Field, inputClass } from "@/components/ui/Field";
import { maskCPF } from "@/lib/masks";
import { calcularProposta } from "@/lib/propostas/proposal-calculations";
import { formatarNumero, temPlaceholderPendente } from "@/lib/propostas/proposal-text";
import { EtapaProps, Secao } from "../ui";

export default function Etapa4Pos({ dados, set }: EtapaProps) {
  const r = calcularProposta(dados);
  const pendente = temPlaceholderPendente(dados.clausula211) || temPlaceholderPendente(dados.clausula212);

  return (
    <div className="space-y-5">
      <Secao titulo="Ordem de serviço">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Número da OS">
            <input inputMode="numeric" className={inputClass} placeholder="Campo numérico" value={dados.osNumero} onChange={(e) => set("osNumero", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <span />
          <Field label="Data de início da OS">
            <input type="date" className={inputClass} value={dados.osDataInicio} onChange={(e) => set("osDataInicio", e.target.value)} />
          </Field>
          <Field label="Data de fim da OS">
            <input type="date" className={inputClass} min={dados.osDataInicio || undefined} value={dados.osDataFim} onChange={(e) => set("osDataFim", e.target.value)} />
          </Field>
          <Field label="Colaborador responsável">
            <input className={inputClass} value={dados.osColaborador} onChange={(e) => set("osColaborador", e.target.value)} />
          </Field>
          <Field label="CPF do colaborador responsável">
            <input className={inputClass} placeholder="000.000.000-00" value={dados.osColaboradorCpf} onChange={(e) => set("osColaboradorCpf", maskCPF(e.target.value))} />
          </Field>
        </div>
      </Secao>

      <Secao titulo="Informações para o contrato comercial">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nacionalidade">
            <input className={inputClass} value={dados.nacionalidade} onChange={(e) => set("nacionalidade", e.target.value)} />
          </Field>
          <Field label="Geração mensal (kWh)" hint="Calculada no dimensionamento — não é editável.">
            <input className={`${inputClass} bg-panel-bg`} readOnly value={formatarNumero(r.geracaoMensalKwh)} />
          </Field>
        </div>
        <Field label="Informações adicionais para o contrato">
          <textarea rows={2} className={inputClass} value={dados.infoContrato} onChange={(e) => set("infoContrato", e.target.value)} />
        </Field>
        {pendente && (
          <div className="flex items-start gap-2 rounded-lg border border-badge-amber-text/40 bg-badge-amber-bg p-3 text-[12.5px] text-badge-amber-text">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            As cláusulas ainda têm marcadores do modelo (valor, VALOR POR ESCRITO, FORMA DE PAGAMENTO). A proposta e a OS imprimem normalmente, mas o contrato só imprime depois que isso for substituído.
          </div>
        )}
        <Field label="Cláusula 2.1.1">
          <textarea rows={3} className={inputClass} value={dados.clausula211} onChange={(e) => set("clausula211", e.target.value)} />
        </Field>
        <Field label="Cláusula 2.1.2">
          <textarea rows={3} className={inputClass} value={dados.clausula212} onChange={(e) => set("clausula212", e.target.value)} />
        </Field>
      </Secao>
    </div>
  );
}
