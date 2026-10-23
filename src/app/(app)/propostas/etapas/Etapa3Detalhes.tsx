"use client";

import { Plus, Trash2 } from "lucide-react";
import { Field, inputClass, inputErrorClass } from "@/components/ui/Field";
import { inversorVazio, novoId } from "@/lib/propostas/dados-iniciais";
import { ALIQUOTA_COMISSAO, ALIQUOTA_IMPOSTO, MAO_DE_OBRA_POR_MODULO, calcularProposta } from "@/lib/propostas/proposal-calculations";
import { formatarBRL, formatarNumero } from "@/lib/propostas/proposal-text";
import { TENSOES_REDE } from "@/lib/propostas/constants";
import { FASE_LABEL, type FaseRede, type InversorKit } from "@/lib/propostas/types";
import { EtapaProps, MoedaInput, NumeroInput, Resumo, Secao } from "../ui";

const btnSec =
  "flex items-center gap-1.5 rounded-lg border border-border text-text-gray font-semibold text-[13px] px-3 py-1.5 hover:bg-panel-bg transition-colors";

export default function Etapa3Detalhes({ dados, set, erros }: EtapaProps) {
  const r = calcularProposta(dados);
  const cls = (campo: string) => `${inputClass} ${erros[campo] ? inputErrorClass : ""}`;

  function setModulo<K extends keyof typeof dados.modulo>(campo: K, valor: (typeof dados.modulo)[K]) {
    set("modulo", { ...dados.modulo, [campo]: valor });
  }
  function setInversor(id: string, patch: Partial<InversorKit>) {
    set("inversores", dados.inversores.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  return (
    <div className="space-y-5">
      <Resumo
        itens={[
          { rotulo: "Dimensionado", valor: `${formatarNumero(r.geracaoMensalKwh / 1000, 2)} MWh · ${formatarNumero(r.kwpNecessario)} kWp` },
          { rotulo: "Kit", valor: `${formatarNumero(r.potenciaRealKwp)} kWp · ${r.quantidadeModulos} módulos` },
          { rotulo: "Área", valor: `${formatarNumero(r.areaTotalM2)} m²` },
          { rotulo: "Total do kit", valor: formatarBRL(r.valorKit) },
          { rotulo: "Total da proposta", valor: formatarBRL(r.valorTotal), destaque: true },
          { rotulo: "Preço / kWp", valor: formatarBRL(r.precoPorKwp) },
        ]}
      />

      <Secao titulo="Kit" subtitulo="Escolha como o kit será definido.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="rounded-lg border border-border p-3 opacity-60 cursor-not-allowed">
            <span className="flex items-center gap-2 text-[13.5px] font-semibold text-text-dark">
              <input type="radio" disabled checked={dados.modoKit === "sistema"} readOnly />
              Kit gerado pelo sistema
            </span>
            <span className="block text-[12px] text-text-faint mt-1">Indisponível: depende do catálogo de distribuidores, ainda não integrado.</span>
          </label>
          <label className={`rounded-lg border p-3 cursor-pointer ${dados.modoKit === "manual" ? "border-brand bg-brand-soft" : "border-border"}`}>
            <span className="flex items-center gap-2 text-[13.5px] font-semibold text-text-dark">
              <input type="radio" checked={dados.modoKit === "manual"} onChange={() => set("modoKit", "manual")} />
              Dimensionar kit manualmente
            </span>
            <span className="block text-[12px] text-text-faint mt-1">Informe módulo, inversores e itens extras.</span>
          </label>
        </div>
      </Secao>

      <Secao titulo="Módulo" subtitulo={`Quantidade sugerida pelo dimensionamento: ${r.quantidadeModulosCalculada}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Marca do módulo" required error={erros.moduloMarca}>
            <input className={cls("moduloMarca")} value={dados.modulo.marca} onChange={(e) => setModulo("marca", e.target.value)} />
          </Field>
          <Field label="Potência do módulo" required error={erros.moduloPotencia}>
            <NumeroInput value={dados.modulo.potenciaW} onChange={(n) => setModulo("potenciaW", n)} sufixo="W" className={erros.moduloPotencia ? inputErrorClass : ""} />
          </Field>
          <Field label="Modelo do módulo" required error={erros.moduloModelo}>
            <input className={cls("moduloModelo")} value={dados.modulo.modelo} onChange={(e) => setModulo("modelo", e.target.value)} />
          </Field>
          <Field label="Quantidade" hint="Vazio = usa a quantidade calculada.">
            <NumeroInput value={dados.modulo.quantidade ?? 0} onChange={(n) => setModulo("quantidade", n || undefined)} placeholder={String(r.quantidadeModulosCalculada)} />
          </Field>
          <Field label="Largura">
            <NumeroInput value={dados.modulo.larguraMm ?? 0} onChange={(n) => setModulo("larguraMm", n || undefined)} sufixo="mm" />
          </Field>
          <Field label="Comprimento">
            <NumeroInput value={dados.modulo.comprimentoMm ?? 0} onChange={(n) => setModulo("comprimentoMm", n || undefined)} sufixo="mm" />
          </Field>
          <Field label="Valor unitário">
            <MoedaInput value={dados.modulo.valorUnitario} onChange={(n) => setModulo("valorUnitario", n)} />
          </Field>
          <Field label="Garantia de desempenho (anos)">
            <NumeroInput value={dados.modulo.garantiaDesempenhoAnos ?? 0} onChange={(n) => setModulo("garantiaDesempenhoAnos", n || undefined)} />
          </Field>
          <Field label="Garantia de fabricação (anos)">
            <NumeroInput value={dados.modulo.garantiaFabricacaoAnos ?? 0} onChange={(n) => setModulo("garantiaFabricacaoAnos", n || undefined)} />
          </Field>
        </div>
      </Secao>

      <Secao titulo="Inversores" subtitulo={erros.inversores}>
        {dados.inversores.map((inv, idx) => (
          <div key={inv.id} className="rounded-lg border border-border-soft p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-brand-strong">Inversor {idx + 1}</span>
              {dados.inversores.length > 1 && (
                <button type="button" className="text-text-faint hover:text-badge-red-text" onClick={() => set("inversores", dados.inversores.filter((i) => i.id !== inv.id))} aria-label="Remover inversor">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Marca do inversor" required>
                <input className={inputClass} value={inv.marca} onChange={(e) => setInversor(inv.id, { marca: e.target.value })} />
              </Field>
              <Field label="Potência do inversor" required>
                <NumeroInput value={inv.potenciaKw} onChange={(n) => setInversor(inv.id, { potenciaKw: n })} sufixo="kW" />
              </Field>
              <Field label="Modelo do inversor" required>
                <input className={inputClass} value={inv.modelo} onChange={(e) => setInversor(inv.id, { modelo: e.target.value })} />
              </Field>
              <Field label="Tensão de saída" required>
                <select className={inputClass} value={inv.tensaoSaida} onChange={(e) => setInversor(inv.id, { tensaoSaida: e.target.value })}>
                  {TENSOES_REDE.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Fase do inversor">
                <select className={inputClass} value={inv.fase} onChange={(e) => setInversor(inv.id, { fase: e.target.value as FaseRede })}>
                  {(Object.keys(FASE_LABEL) as FaseRede[]).map((f) => (
                    <option key={f} value={f}>
                      {FASE_LABEL[f]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Potência máxima">
                <NumeroInput value={inv.potenciaMaximaVA ?? 0} onChange={(n) => setInversor(inv.id, { potenciaMaximaVA: n || undefined })} sufixo="VA" />
              </Field>
              <Field label="Valor unitário" required>
                <MoedaInput value={inv.valorUnitario} onChange={(n) => setInversor(inv.id, { valorUnitario: n })} />
              </Field>
              <Field label="Quantidade" required>
                <NumeroInput value={inv.quantidade} onChange={(n) => setInversor(inv.id, { quantidade: n })} />
              </Field>
              <Field label="Garantia de fabricação (anos)">
                <NumeroInput value={inv.garantiaFabricacaoAnos ?? 0} onChange={(n) => setInversor(inv.id, { garantiaFabricacaoAnos: n || undefined })} />
              </Field>
            </div>
          </div>
        ))}
        <button type="button" className={btnSec} onClick={() => set("inversores", [...dados.inversores, inversorVazio()])}>
          <Plus size={14} /> Novo inversor
        </button>
      </Secao>

      <Secao titulo="Outros itens do kit" subtitulo="Cabos, conectores, string box etc. Entram no valor do kit.">
        {dados.outrosKit.map((o) => (
          <div key={o.id} className="grid grid-cols-12 gap-3 items-end">
            <Field label="Item" className="col-span-6">
              <input className={inputClass} value={o.nome} onChange={(e) => set("outrosKit", dados.outrosKit.map((x) => (x.id === o.id ? { ...x, nome: e.target.value } : x)))} />
            </Field>
            <Field label="Qtd." className="col-span-2">
              <NumeroInput value={o.quantidade} onChange={(n) => set("outrosKit", dados.outrosKit.map((x) => (x.id === o.id ? { ...x, quantidade: n } : x)))} />
            </Field>
            <Field label="Valor unitário" className="col-span-3">
              <MoedaInput value={o.valorUnitario} onChange={(n) => set("outrosKit", dados.outrosKit.map((x) => (x.id === o.id ? { ...x, valorUnitario: n } : x)))} />
            </Field>
            <button type="button" className="col-span-1 pb-3 text-text-faint hover:text-badge-red-text" onClick={() => set("outrosKit", dados.outrosKit.filter((x) => x.id !== o.id))} aria-label="Remover item">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button type="button" className={btnSec} onClick={() => set("outrosKit", [...dados.outrosKit, { id: novoId(), nome: "", quantidade: 1, valorUnitario: 0 }])}>
          <Plus size={14} /> Novo item
        </button>
        <Field label="Preço do kit (opcional)" hint={`Se preencher, substitui a soma dos itens (${formatarBRL(r.valorKit)} calculado).`}>
          <MoedaInput value={dados.precoKitManual ?? 0} onChange={(n) => set("precoKitManual", n || undefined)} />
        </Field>
      </Secao>

      <Secao
        titulo="Itens complementares e custos"
        subtitulo={`Imposto embutido de ${formatarNumero(ALIQUOTA_IMPOSTO * 100)}% (valor ÷ ${formatarNumero(1 - ALIQUOTA_IMPOSTO, 4)}).`}
      >
        <label className="flex items-center gap-2 text-[13px] text-text-gray">
          <input type="checkbox" checked={dados.incluirInstalacao} onChange={(e) => set("incluirInstalacao", e.target.checked)} />
          Incluir instalação: {formatarBRL(MAO_DE_OBRA_POR_MODULO)} × {r.quantidadeModulos} módulos = {formatarBRL(r.instalacao?.valorTotal ?? MAO_DE_OBRA_POR_MODULO * r.quantidadeModulos)}
        </label>
        <label className="flex items-center gap-2 text-[13px] text-text-gray">
          <input type="checkbox" checked={dados.incluirComissao} onChange={(e) => set("incluirComissao", e.target.checked)} />
          Embutir comissão do vendedor de {formatarNumero(ALIQUOTA_COMISSAO * 100, 0)}% no preço total
        </label>

        {r.complementares.map((c) => (
          <div key={c.id} className="grid grid-cols-12 gap-3 items-end">
            <Field label="Item" className="col-span-4">
              <input className={inputClass} value={c.nome} onChange={(e) => set("complementares", dados.complementares.map((x) => (x.id === c.id ? { ...x, nome: e.target.value } : x)))} />
            </Field>
            <Field label="Qtd." className="col-span-1">
              <NumeroInput value={c.quantidade} onChange={(n) => set("complementares", dados.complementares.map((x) => (x.id === c.id ? { ...x, quantidade: n } : x)))} />
            </Field>
            <Field label="Valor unitário" className="col-span-3">
              <MoedaInput value={c.valorUnitario} onChange={(n) => set("complementares", dados.complementares.map((x) => (x.id === c.id ? { ...x, valorUnitario: n } : x)))} />
            </Field>
            <label className="col-span-2 pb-3 flex items-center gap-1.5 text-[12px] text-text-gray">
              <input type="checkbox" checked={c.aplicaImposto} onChange={(e) => set("complementares", dados.complementares.map((x) => (x.id === c.id ? { ...x, aplicaImposto: e.target.checked } : x)))} />
              Com imposto
            </label>
            <span className="col-span-1 pb-3 text-[12px] text-text-dark text-right">{formatarBRL(c.valorComImposto)}</span>
            <button type="button" className="col-span-1 pb-3 text-text-faint hover:text-badge-red-text" onClick={() => set("complementares", dados.complementares.filter((x) => x.id !== c.id))} aria-label="Remover item">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button type="button" className={btnSec} onClick={() => set("complementares", [...dados.complementares, { id: novoId(), nome: "", quantidade: 1, valorUnitario: 0, aplicaImposto: true }])}>
          <Plus size={14} /> Novo item complementar
        </button>
        <div className="text-[12.5px] text-text-gray space-y-0.5 pt-2 border-t border-border-soft">
          <div>Complementares com imposto: <b className="text-text-dark">{formatarBRL(r.totalComplementaresComImposto)}</b></div>
          {r.instalacao && <div>Instalação com imposto: <b className="text-text-dark">{formatarBRL(r.instalacao.valorComImposto)}</b></div>}
          {r.comissao > 0 && <div>Comissão embutida: <b className="text-text-dark">{formatarBRL(r.comissao)}</b></div>}
          <div>Imposto pago: <b className="text-text-dark">{formatarBRL(r.impostoPagoTotal)}</b></div>
        </div>
      </Secao>
    </div>
  );
}
