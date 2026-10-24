"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Field, inputClass, inputErrorClass } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { buscarTarifasAneel } from "@/lib/propostas/tarifas-client";
import {
  CUSTO_DISPONIBILIDADE_KWH,
  IRRADIACAO_PADRAO_WH_M2_DIA,
  TAXA_DESEMPENHO_PADRAO_PCT,
  geracaoEspecifica,
  kwpNecessario,
  whParaKwh,
} from "@/lib/propostas/proposal-calculations";
import { formatarDataBR, formatarNumero } from "@/lib/propostas/proposal-text";
import { CONCESSIONARIAS_SUGERIDAS, TENSAO_PADRAO_POR_FASE, TENSOES_POR_FASE, TIPOS_ESTRUTURA } from "@/lib/propostas/constants";
import { FASE_LABEL, type FaseRede } from "@/lib/propostas/types";
import { EtapaProps, NumeroInput, Secao } from "../ui";

export default function Etapa2Dimensionamento({ dados, set, erros }: EtapaProps) {
  const cls = (campo: string) => `${inputClass} ${erros[campo] ? inputErrorClass : ""}`;
  const { showToast } = useToast();
  const [buscando, setBuscando] = useState(false);
  const [origemTarifas, setOrigemTarifas] = useState("");
  const ultimaBusca = useRef("");
  const gerEsp = geracaoEspecifica(dados.irradiacaoWhM2Dia, dados.taxaDesempenhoPct);
  const kwp = kwpNecessario(dados.consumoMedioKwh, dados.fase, gerEsp);

  /** Trocar a fase já escolhe a tensão correspondente (e acompanha os inversores do kit). */
  function trocarFase(fase: FaseRede) {
    const tensao = TENSAO_PADRAO_POR_FASE[fase];
    set("fase", fase);
    set("tensao", tensao);
    set("inversores", dados.inversores.map((i) => ({ ...i, fase, tensaoSaida: tensao })));
  }

  async function buscarTarifas(automatico: boolean) {
    if (!dados.concessionaria.trim()) {
      if (!automatico) showToast("Informe a concessionária primeiro", "error");
      return;
    }
    ultimaBusca.current = `${dados.concessionaria}|${dados.perfilConcessionaria}`;
    setBuscando(true);
    const r = await buscarTarifasAneel(dados.concessionaria, dados.perfilConcessionaria);
    setBuscando(false);
    if (!r.ok) {
      setOrigemTarifas(automatico ? "" : r.erro);
      if (!automatico) showToast(r.erro, "error");
      else setOrigemTarifas(`Não foi possível buscar na ANEEL (${r.erro}). Informe manualmente.`);
      return;
    }
    const t = r.tarifas;
    set("tarifaTE", t.te);
    set("tarifaTUSD", t.tusd);
    if (t.fioB !== null) set("tarifaFioB", t.fioB);
    setOrigemTarifas(
      `Tarifas da ANEEL (${t.distribuidora} · ${t.subgrupo}), vigentes desde ${formatarDataBR(t.vigenciaInicio)}, sem impostos.${t.avisos.length ? " " + t.avisos.join(" ") : ""}`
    );
  }

  // Preenche sozinho quando a concessionária/perfil é definida e as tarifas ainda estão vazias.
  useEffect(() => {
    const chave = `${dados.concessionaria}|${dados.perfilConcessionaria}`;
    if (dados.concessionaria.trim().length < 3 || ultimaBusca.current === chave) return;
    if (dados.tarifaTE || dados.tarifaTUSD || dados.tarifaFioB) return;
    const timer = setTimeout(() => buscarTarifas(true), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.concessionaria, dados.perfilConcessionaria]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <Secao titulo="Dados da fatura">
        <Field label="Concessionária" required error={erros.concessionaria}>
          <input list="concessionarias" className={cls("concessionaria")} value={dados.concessionaria} onChange={(e) => set("concessionaria", e.target.value)} />
          <datalist id="concessionarias">
            {CONCESSIONARIAS_SUGERIDAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Perfil da concessionária" required hint="Define as tarifas buscadas na ANEEL.">
          <select className={inputClass} value={dados.perfilConcessionaria} onChange={(e) => set("perfilConcessionaria", e.target.value as "B1" | "B2" | "B3")}>
            <option value="B1">B1 - Residencial</option>
            <option value="B2">B2 - Rural</option>
            <option value="B3">B3 - Comercial</option>
          </select>
        </Field>
        <Field label="Código da unidade consumidora (UC)">
          <input className={inputClass} placeholder="Ex.: A1B2C345" value={dados.codigoUC} onChange={(e) => set("codigoUC", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fase da rede do cliente" required>
            <select className={inputClass} value={dados.fase} onChange={(e) => trocarFase(e.target.value as FaseRede)}>
              {(Object.keys(FASE_LABEL) as FaseRede[]).map((f) => (
                <option key={f} value={f}>
                  {FASE_LABEL[f]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tensão da rede do cliente">
            <select className={inputClass} value={dados.tensao} onChange={(e) => set("tensao", e.target.value)}>
              {(TENSOES_POR_FASE[dados.fase].includes(dados.tensao) ? TENSOES_POR_FASE[dados.fase] : [dados.tensao, ...TENSOES_POR_FASE[dados.fase]]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          label="Consumo médio mensal"
          required
          error={erros.consumoMedioKwh}
          hint={`Custo de disponibilidade (${FASE_LABEL[dados.fase]}): ${CUSTO_DISPONIBILIDADE_KWH[dados.fase]} kWh · Potência estimada da usina: ${formatarNumero(kwp)} kWp`}
        >
          <NumeroInput value={dados.consumoMedioKwh} onChange={(n) => set("consumoMedioKwh", n)} sufixo="kWh" className={erros.consumoMedioKwh ? inputErrorClass : ""} />
        </Field>
        <div className="flex flex-wrap items-center gap-3 -mb-1">
          <button
            type="button"
            disabled={buscando}
            onClick={() => buscarTarifas(false)}
            className="flex items-center gap-1.5 rounded-lg border border-border text-text-gray font-semibold text-[13px] px-3 py-1.5 hover:bg-panel-bg transition-colors disabled:opacity-60"
          >
            <RefreshCw size={13} className={buscando ? "animate-spin" : ""} />
            {buscando ? "Buscando na ANEEL..." : "Buscar tarifas na ANEEL"}
          </button>
          {origemTarifas && <span className="text-[12px] text-text-faint">{origemTarifas}</span>}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Tarifa TE" required error={erros.tarifaTE}>
            <NumeroInput value={dados.tarifaTE} onChange={(n) => set("tarifaTE", n)} sufixo="R$/kWh" casas={6} className={erros.tarifaTE ? inputErrorClass : ""} />
          </Field>
          <Field label="Tarifa TUSD" required error={erros.tarifaTUSD}>
            <NumeroInput value={dados.tarifaTUSD} onChange={(n) => set("tarifaTUSD", n)} sufixo="R$/kWh" casas={6} className={erros.tarifaTUSD ? inputErrorClass : ""} />
          </Field>
          <Field label="Tarifa de Fio B" required error={erros.tarifaFioB}>
            <NumeroInput value={dados.tarifaFioB} onChange={(n) => set("tarifaFioB", n)} sufixo="R$/kWh" casas={6} className={erros.tarifaFioB ? inputErrorClass : ""} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Outras taxas mensais — antes da solar">
            <NumeroInput value={dados.taxasAntesSolar} onChange={(n) => set("taxasAntesSolar", n)} sufixo="R$" casas={2} />
          </Field>
          <Field label="Outras taxas mensais — depois da solar">
            <NumeroInput value={dados.taxasDepoisSolar} onChange={(n) => set("taxasDepoisSolar", n)} sufixo="R$" casas={2} />
          </Field>
        </div>
        <div>
          <span className="block text-[13px] font-medium text-text-dark mb-1.5">Considerar crédito acumulado no payback</span>
          <div className="flex gap-4 text-[13px] text-text-gray">
            {[true, false].map((v) => (
              <label key={String(v)} className="flex items-center gap-1.5">
                <input type="radio" checked={dados.considerarCreditoNoPayback === v} onChange={() => set("considerarCreditoNoPayback", v)} />
                {v ? "Sim" : "Não"}
              </label>
            ))}
          </div>
        </div>
      </Secao>

      <Secao titulo="Dados da usina">
        <Field
          label="Taxa de desempenho"
          required
          error={erros.taxaDesempenhoPct}
          hint={dados.taxaDesempenhoPct !== TAXA_DESEMPENHO_PADRAO_PCT ? `Alterada manualmente (padrão: ${TAXA_DESEMPENHO_PADRAO_PCT}%)` : undefined}
        >
          <NumeroInput value={dados.taxaDesempenhoPct} onChange={(n) => set("taxaDesempenhoPct", n)} sufixo="%" casas={2} className={erros.taxaDesempenhoPct ? inputErrorClass : ""} />
        </Field>
        <Field
          label="Fator de geração (irradiação)"
          required
          error={erros.irradiacaoWhM2Dia}
          hint={`${formatarNumero(whParaKwh(dados.irradiacaoWhM2Dia), 4)} kWh/m²·dia → ${formatarNumero(gerEsp)} kWh/kWp ao mês${
            dados.irradiacaoWhM2Dia !== IRRADIACAO_PADRAO_WH_M2_DIA ? " · valor diferente do padrão" : ""
          }`}
        >
          <NumeroInput value={dados.irradiacaoWhM2Dia} onChange={(n) => set("irradiacaoWhM2Dia", n)} sufixo="Wh/m²·dia" casas={2} className={erros.irradiacaoWhM2Dia ? inputErrorClass : ""} />
        </Field>
        <Field label="Tipo de estrutura" required error={erros.tipoEstrutura}>
          <select className={cls("tipoEstrutura")} value={dados.tipoEstrutura} onChange={(e) => set("tipoEstrutura", e.target.value)}>
            <option value="">Selecionar estrutura...</option>
            {TIPOS_ESTRUTURA.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Incluir estrutura em" required>
          <select className={inputClass} value={dados.incluirEstruturaEm} onChange={(e) => set("incluirEstruturaEm", e.target.value as "kit" | "complementares")}>
            <option value="kit">Kit</option>
            <option value="complementares">Itens complementares</option>
          </select>
        </Field>
        <Field label="Mão de obra" hint="Descrição que aparece na Ordem de Serviço. O valor da instalação é calculado na etapa Detalhes.">
          <input className={inputClass} value={dados.maoDeObra} onChange={(e) => set("maoDeObra", e.target.value)} />
        </Field>
        <Field label="Validade da proposta" required error={erros.validade} hint="Nasce como hoje + 7 dias.">
          <input type="date" className={cls("validade")} value={dados.validade} onChange={(e) => set("validade", e.target.value)} />
        </Field>
        <Field label="Observação">
          <textarea rows={3} className={inputClass} placeholder="Adicione uma observação para sua proposta" value={dados.observacao} onChange={(e) => set("observacao", e.target.value)} />
        </Field>
      </Secao>
    </div>
  );
}
