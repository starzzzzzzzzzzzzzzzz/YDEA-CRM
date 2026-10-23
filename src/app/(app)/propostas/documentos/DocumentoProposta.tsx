import { PREMISSAS, geracaoPorMes, whParaKwh } from "@/lib/propostas/proposal-calculations";
import { formatarBRL, formatarDataBR, formatarNumero, hojeISO, valorOuTraco as t } from "@/lib/propostas/proposal-text";
import { FASE_LABEL } from "@/lib/propostas/types";
import { COR_FORTE, COR_PRIMARIA, COR_SUAVE, H2, Linha, Pagina, Tabela } from "./Pagina";
import { ContextoDocumento, enderecoUsina } from "./dados-documento";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const TOTAL = 8;

/** Gráfico de barras em SVG puro (imprime igual em qualquer navegador). */
function GraficoMensal({ consumo, geracao }: { consumo: number[]; geracao: number[] }) {
  const max = Math.max(...consumo, ...geracao, 1);
  const larguraBarra = 9;
  return (
    <svg viewBox="0 0 640 220" style={{ width: "100%", height: "auto" }} role="img" aria-label="Consumo versus geração mensal">
      {MESES.map((m, i) => {
        const x = 20 + i * 51;
        const hc = (consumo[i] / max) * 170;
        const hg = (geracao[i] / max) * 170;
        return (
          <g key={m}>
            <rect x={x} y={185 - hc} width={larguraBarra * 2} height={hc} fill="#bfc5c8" />
            <rect x={x + larguraBarra * 2 + 2} y={185 - hg} width={larguraBarra * 2} height={hg} fill={COR_PRIMARIA} />
            <text x={x + larguraBarra * 2} y={202} fontSize="10" textAnchor="middle" fill={COR_SUAVE}>
              {m}
            </text>
          </g>
        );
      })}
      <line x1="14" y1="185" x2="630" y2="185" stroke="#d0d0d0" />
      <rect x="20" y="4" width="10" height="10" fill="#bfc5c8" />
      <text x="34" y="13" fontSize="10" fill={COR_SUAVE}>Consumo (kWh)</text>
      <rect x="130" y="4" width="10" height="10" fill={COR_PRIMARIA} />
      <text x="144" y="13" fontSize="10" fill={COR_SUAVE}>Geração (kWh)</text>
    </svg>
  );
}

export default function DocumentoProposta({ ctx }: { ctx: ContextoDocumento }) {
  const { dados: d, r } = ctx;
  const kwp = formatarNumero(r.potenciaRealKwp);
  const geracaoMeses = geracaoPorMes(r.geracaoAnualKwh, ctx.criadoEm.getFullYear());
  const consumoMeses = Array.from({ length: 12 }, () => d.consumoMedioKwh);
  const inversoresTotal = d.inversores.reduce((s, i) => s + i.quantidade, 0);
  const consumoAnual = d.consumoMedioKwh * 12;
  const economiaAno1 = r.projecao[0]?.economia ?? 0;

  return (
    <>
      {/* 1 — Capa */}
      <Pagina numero={1} total={TOTAL}>
        <div style={{ marginTop: "30mm" }}>
          <div style={{ color: COR_PRIMARIA, fontSize: "12pt" }}>Número da Proposta: {ctx.numero ?? "-"}</div>
          <h1 style={{ fontSize: "30pt", fontWeight: 700, margin: "2mm 0 8mm", color: "#1a1a1a" }}>{t(d.clienteNome)}</h1>
          <div style={{ fontSize: "11pt", lineHeight: 1.9 }}>
            <div><b>Projeto:</b> {t(d.nomeProjeto)}</div>
            <div><b>Potência do sistema:</b> {kwp} kWp</div>
            <div><b>Endereço da usina:</b> {enderecoUsina(d)}</div>
            <div><b>Consultor:</b> {t(d.consultorNome)} · {t(d.consultorTelefone)} · {t(d.consultorEmail)}</div>
            <div><b>Emitida em:</b> {formatarDataBR(hojeISO(ctx.criadoEm))}</div>
            <div><b>Validade da proposta:</b> {formatarDataBR(d.validade)}</div>
          </div>
        </div>
      </Pagina>

      {/* 2 — Resumo do investimento */}
      <Pagina titulo="Resumo da proposta" numero={2} total={TOTAL}>
        <H2>Sua proposta em números</H2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm", margin: "4mm 0 8mm" }}>
          {[
            ["Potência do sistema", `${kwp} kWp`],
            ["Geração média mensal", `${formatarNumero(r.geracaoMensalKwh, 0)} kWh`],
            ["Economia estimada no 1º ano", formatarBRL(economiaAno1)],
            ["Investimento total", formatarBRL(r.valorTotal)],
          ].map(([rot, val]) => (
            <div key={rot} style={{ border: `0.4mm solid ${COR_PRIMARIA}`, borderRadius: "3mm", padding: "4mm" }}>
              <div style={{ fontSize: "9.5pt", color: COR_SUAVE }}>{rot}</div>
              <div style={{ fontSize: "17pt", fontWeight: 700, color: COR_FORTE }}>{val}</div>
            </div>
          ))}
        </div>
        <H2>Dados da unidade consumidora</H2>
        <Linha rotulo="Concessionária" valor={t(d.concessionaria)} />
        <Linha rotulo="Unidade consumidora (UC)" valor={t(d.codigoUC)} />
        <Linha rotulo="Fase / tensão" valor={`${FASE_LABEL[d.fase]} / ${t(d.tensao)}`} />
        <Linha rotulo="Consumo médio mensal" valor={`${formatarNumero(d.consumoMedioKwh, 0)} kWh`} />
        <Linha rotulo="Custo de disponibilidade" valor={`${r.custoDisponibilidadeKwh} kWh/mês`} />
      </Pagina>

      {/* 3 — Especificações técnicas */}
      <Pagina titulo="Especificações técnicas" numero={3} total={TOTAL}>
        <H2>Sistema fotovoltaico</H2>
        <Linha rotulo="Módulos fotovoltaicos" valor={`${r.quantidadeModulos} × ${t(d.modulo.marca)} ${t(d.modulo.modelo)} (${formatarNumero(d.modulo.potenciaW, 0)} W)`} />
        <Linha rotulo="Inversores" valor={`${inversoresTotal} un.`} />
        {d.inversores.map((i) => (
          <Linha key={i.id} rotulo={`  ${t(i.marca)} ${t(i.modelo)}`} valor={`${i.quantidade} × ${formatarNumero(i.potenciaKw)} kW · ${t(i.tensaoSaida)}`} />
        ))}
        <Linha rotulo="Potência instalada" valor={`${kwp} kWp`} />
        <Linha rotulo="Área ocupada" valor={r.areaTotalM2 ? `${formatarNumero(r.areaTotalM2)} m²` : "-"} />
        <Linha rotulo="Tipo de estrutura" valor={t(d.tipoEstrutura)} />
        <Linha rotulo="Garantia de desempenho dos módulos" valor={d.modulo.garantiaDesempenhoAnos ? `${d.modulo.garantiaDesempenhoAnos} anos` : "-"} />
        <Linha rotulo="Garantia de fabricação dos módulos" valor={d.modulo.garantiaFabricacaoAnos ? `${d.modulo.garantiaFabricacaoAnos} anos` : "-"} />
        <div style={{ height: "6mm" }} />
        <H2>Desempenho esperado</H2>
        <Linha rotulo="Irradiação solar" valor={`${formatarNumero(whParaKwh(d.irradiacaoWhM2Dia), 4)} kWh/m²·dia`} />
        <Linha rotulo="Taxa de desempenho" valor={`${formatarNumero(d.taxaDesempenhoPct)} %`} />
        <Linha rotulo="Geração específica" valor={`${formatarNumero(r.geracaoEspecificaKwhKwpMes)} kWh/kWp·mês`} />
        <Linha rotulo="Geração anual estimada" valor={`${formatarNumero(r.geracaoAnualKwh, 0)} kWh`} />
        <Linha rotulo="Redução de emissões de CO₂" valor={`${formatarNumero(r.reducaoCo2ToneladasAno)} toneladas/ano`} />
      </Pagina>

      {/* 4 — Consumo x geração */}
      <Pagina titulo="Consumo × geração" numero={4} total={TOTAL}>
        <H2>Consumo e geração nos 12 meses</H2>
        <GraficoMensal consumo={consumoMeses} geracao={geracaoMeses} />
        <div style={{ height: "4mm" }} />
        <Tabela
          colunas={["Mês", "Consumo (kWh)", "Geração (kWh)", "Saldo (kWh)"]}
          alinhar={["left", "right", "right", "right"]}
          linhas={MESES.map((m, i) => [m, formatarNumero(consumoMeses[i], 0), formatarNumero(geracaoMeses[i], 0), formatarNumero(geracaoMeses[i] - consumoMeses[i], 0)])}
        />
        <p style={{ fontSize: "8.5pt", color: COR_SUAVE, marginTop: "3mm" }}>
          Geração distribuída pelos meses conforme o número de dias, a partir da média anual estimada ({formatarNumero(r.geracaoAnualKwh, 0)} kWh). Consumo anual de referência: {formatarNumero(consumoAnual, 0)} kWh.
        </p>
      </Pagina>

      {/* 5 — Investimento */}
      <Pagina titulo="Investimento" numero={5} total={TOTAL}>
        <H2>Composição do investimento</H2>
        <Tabela
          colunas={["Item", "Valor"]}
          alinhar={["left", "right"]}
          linhas={[
            ["Kit fotovoltaico", formatarBRL(r.valorKit)],
            ...r.complementares.map((c) => [t(c.nome), formatarBRL(c.valorComImposto)]),
            ...(r.instalacao ? [["Instalação", formatarBRL(r.instalacao.valorComImposto)]] : []),
          ]}
        />
        <div style={{ marginTop: "6mm", padding: "5mm", background: "#f7f7f5", borderRadius: "3mm" }}>
          <Linha rotulo="Valor total da proposta" valor={formatarBRL(r.valorTotal)} />
          <Linha rotulo="Preço por kWp" valor={formatarBRL(r.precoPorKwp)} />
        </div>
        {d.observacao.trim() && (
          <p style={{ marginTop: "6mm", fontSize: "10pt" }}>
            <b>Observações:</b> {d.observacao}
          </p>
        )}
        <p style={{ marginTop: "6mm", fontSize: "10pt" }}>
          <b>Validade desta proposta:</b> {formatarDataBR(d.validade)}
        </p>
      </Pagina>

      {/* 6 — Projeção financeira */}
      <Pagina titulo="Projeção financeira" numero={6} total={TOTAL}>
        <H2>Retorno do investimento</H2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm", margin: "3mm 0 6mm" }}>
          <div style={{ border: `0.4mm solid ${COR_PRIMARIA}`, borderRadius: "3mm", padding: "4mm" }}>
            <div style={{ fontSize: "9.5pt", color: COR_SUAVE }}>Economia média mensal (1º ano)</div>
            <div style={{ fontSize: "16pt", fontWeight: 700, color: COR_FORTE }}>{formatarBRL(r.economiaMensalAno1)}</div>
          </div>
          <div style={{ border: `0.4mm solid ${COR_PRIMARIA}`, borderRadius: "3mm", padding: "4mm" }}>
            <div style={{ fontSize: "9.5pt", color: COR_SUAVE }}>Payback estimado</div>
            <div style={{ fontSize: "16pt", fontWeight: 700, color: COR_FORTE }}>
              {r.paybackAnos === null ? "Acima de 25 anos" : `${formatarNumero(r.paybackAnos, 1)} anos`}
            </div>
          </div>
        </div>
        <H2>Premissas da projeção</H2>
        <Linha rotulo="Reajuste anual da tarifa" valor={`${formatarNumero(PREMISSAS.reajusteTarifaAnualPct)} %`} />
        <Linha rotulo="Degradação anual dos módulos (a partir do 2º ano)" valor={`${formatarNumero(PREMISSAS.degradacaoAnualPct)} %`} />
        <Linha rotulo="Tarifa TE + TUSD" valor={`${formatarNumero(d.tarifaTE + d.tarifaTUSD, 6)} R$/kWh`} />
        <Linha rotulo="Tarifa Fio B (cobrança progressiva — Lei 14.300)" valor={`${formatarNumero(d.tarifaFioB, 6)} R$/kWh`} />
        <p style={{ fontSize: "8.5pt", color: COR_SUAVE, marginTop: "4mm" }}>
          Estimativa baseada nos dados informados e nas premissas acima. Valores reais dependem do consumo, das tarifas e das condições de irradiação.
        </p>
      </Pagina>

      {/* 7 — Fluxo de caixa */}
      <Pagina titulo="Fluxo de caixa" numero={7} total={TOTAL}>
        <H2>Fluxo de caixa — 25 anos</H2>
        <Tabela
          colunas={["Ano", "Economia no ano", "Fluxo acumulado"]}
          alinhar={["center", "right", "right"]}
          linhas={r.projecao.map((p) => [`${p.ano} (${p.anoCalendario})`, formatarBRL(p.economia), formatarBRL(p.fluxoAcumulado)])}
        />
      </Pagina>

      {/* 8 — Degradação */}
      <Pagina titulo="Degradação e geração" numero={8} total={TOTAL}>
        <H2>Degradação da geração — 25 anos</H2>
        <Tabela
          colunas={["Ano", "Geração (kWh)", "% da geração inicial"]}
          alinhar={["center", "right", "right"]}
          linhas={r.projecao.map((p) => [String(p.ano), formatarNumero(p.geracaoKwh, 0), `${formatarNumero(p.fatorDegradacao * 100)} %`])}
        />
      </Pagina>
    </>
  );
}
