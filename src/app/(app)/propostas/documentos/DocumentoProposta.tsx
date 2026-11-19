import { PREMISSAS, geracaoPorMes, whParaKwh } from "@/lib/propostas/proposal-calculations";
import { formatarBRL, formatarDataBR, formatarNumero, hojeISO, valorOuTraco as t } from "@/lib/propostas/proposal-text";
import { CONTRATADA } from "@/lib/propostas/constants";
import { FASE_LABEL } from "@/lib/propostas/types";
import { COR_FORTE, COR_PRIMARIA, COR_SUAVE, H2, Linha, Pagina, Tabela } from "./Pagina";
import { ContextoDocumento, enderecoUsina } from "./dados-documento";
import type { LinhaProjecao } from "@/lib/propostas/types";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const TOTAL = 8;

/** Escolhe um passo "redondo" e devolve os valores da grade do eixo Y (0 … topo). */
function escalaY(max: number, divisoes = 4): number[] {
  const bruto = Math.max(max, 1) / divisoes;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= bruto) ?? bruto;
  return Array.from({ length: divisoes + 1 }, (_, i) => i * passo);
}

/** Gráfico de barras em SVG puro (imprime igual em qualquer navegador). Eixo Y com valores reais. */
function GraficoMensal({ consumo, geracao }: { consumo: number[]; geracao: number[] }) {
  const grade = escalaY(Math.max(...consumo, ...geracao));
  const topo = grade[grade.length - 1];
  const base = 190;
  const alturaUtil = 160;
  const x0 = 52;
  const passoX = 48;
  const larguraBarra = 9;
  const y = (v: number) => base - (v / topo) * alturaUtil;
  return (
    <svg viewBox="0 0 640 225" style={{ width: "100%", height: "auto" }} role="img" aria-label="Consumo versus geração mensal">
      {grade.map((g) => (
        <g key={g}>
          <line x1={x0 - 6} y1={y(g)} x2="632" y2={y(g)} stroke={g === 0 ? "#b0b0b0" : "#e6e6e6"} />
          <text x={x0 - 10} y={y(g) + 3} fontSize="9" textAnchor="end" fill={COR_SUAVE}>
            {formatarNumero(g, 0)}
          </text>
        </g>
      ))}
      {MESES.map((m, i) => {
        const x = x0 + 4 + i * passoX;
        return (
          <g key={m}>
            <rect x={x} y={y(consumo[i])} width={larguraBarra * 2} height={base - y(consumo[i])} fill="#bfc5c8" />
            <rect x={x + larguraBarra * 2 + 2} y={y(geracao[i])} width={larguraBarra * 2} height={base - y(geracao[i])} fill={COR_PRIMARIA} />
            <text x={x + larguraBarra * 2 + 1} y={base + 13} fontSize="10" textAnchor="middle" fill={COR_SUAVE}>
              {m}
            </text>
            <text x={x + larguraBarra * 3 + 2} y={y(geracao[i]) - 3} fontSize="7.5" textAnchor="middle" fill={COR_FORTE}>
              {formatarNumero(geracao[i], 0)}
            </text>
          </g>
        );
      })}
      <rect x={x0} y="4" width="10" height="10" fill="#bfc5c8" />
      <text x={x0 + 14} y="13" fontSize="10" fill={COR_SUAVE}>Consumo (kWh)</text>
      <rect x={x0 + 110} y="4" width="10" height="10" fill={COR_PRIMARIA} />
      <text x={x0 + 124} y="13" fontSize="10" fill={COR_SUAVE}>Geração (kWh)</text>
    </svg>
  );
}

/** Geração anual ao longo dos 25 anos (já com a degradação dos módulos) contra o consumo anual. */
function GraficoAnual({ projecao, consumoAnual }: { projecao: LinhaProjecao[]; consumoAnual: number }) {
  const maxGeracao = Math.max(...projecao.map((p) => p.geracaoKwh), 1);
  const grade = escalaY(Math.max(maxGeracao, consumoAnual));
  const topo = grade[grade.length - 1];
  const base = 205;
  const alturaUtil = 180;
  const x0 = 56;
  const largTotal = 632 - x0;
  const passoX = largTotal / projecao.length;
  const larguraBarra = passoX * 0.68;
  const y = (v: number) => base - (v / topo) * alturaUtil;
  return (
    <svg viewBox="0 0 640 240" style={{ width: "100%", height: "auto" }} role="img" aria-label="Geração anual estimada em 25 anos">
      {grade.map((g) => (
        <g key={g}>
          <line x1={x0 - 6} y1={y(g)} x2="632" y2={y(g)} stroke={g === 0 ? "#b0b0b0" : "#e6e6e6"} />
          <text x={x0 - 10} y={y(g) + 3} fontSize="9" textAnchor="end" fill={COR_SUAVE}>
            {formatarNumero(g, 0)}
          </text>
        </g>
      ))}
      {projecao.map((p, i) => {
        const x = x0 + i * passoX + (passoX - larguraBarra) / 2;
        const rotulo = i === 0 || (p.ano % 5 === 0) || p.ano === projecao.length;
        return (
          <g key={p.ano}>
            <rect x={x} y={y(p.geracaoKwh)} width={larguraBarra} height={base - y(p.geracaoKwh)} fill={COR_PRIMARIA} />
            {rotulo && (
              <text x={x + larguraBarra / 2} y={base + 12} fontSize="9" textAnchor="middle" fill={COR_SUAVE}>
                {p.ano}
              </text>
            )}
          </g>
        );
      })}
      {/* consumo anual de referência */}
      <line x1={x0} y1={y(consumoAnual)} x2="632" y2={y(consumoAnual)} stroke={COR_FORTE} strokeWidth="1.2" strokeDasharray="5 3" />
      <text x="632" y={y(consumoAnual) - 4} fontSize="8.5" textAnchor="end" fill={COR_FORTE}>
        Consumo anual: {formatarNumero(consumoAnual, 0)} kWh
      </text>
      <text x={x0 + largTotal / 2} y="233" fontSize="9" textAnchor="middle" fill={COR_SUAVE}>Ano de operação</text>
      <text x="10" y="115" fontSize="9" fill={COR_SUAVE} transform="rotate(-90 10 115)" textAnchor="middle">kWh/ano</text>
    </svg>
  );
}

const MESES_EXTENSO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function Assinatura({ papel, nome, detalhe }: { papel: string; nome: string; detalhe?: string }) {
  return (
    <div style={{ textAlign: "center", fontSize: "9pt", lineHeight: 1.45 }}>
      <div style={{ height: "16mm" }} />
      <div style={{ borderTop: "0.3mm solid #1a1a1a", paddingTop: "1.6mm" }}>
        <b style={{ fontSize: "9pt" }}>{papel}</b>
        <div>{nome}</div>
        {detalhe && <div style={{ color: COR_SUAVE, fontSize: "8.5pt" }}>{detalhe}</div>}
      </div>
    </div>
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
  const primeiroAno = r.projecao[0];
  const ultimoAno = r.projecao[r.projecao.length - 1];
  const geracaoTotal25 = r.projecao.reduce((s, p) => s + p.geracaoKwh, 0);
  const corte = Math.ceil(r.projecao.length / 2);
  const metade1 = r.projecao.slice(0, corte);
  const metade2 = r.projecao.slice(corte);
  const cidadeUf = [d.usinaCidade, d.usinaEstado].map((x) => x.trim()).filter(Boolean).join("/");
  const localData = `${cidadeUf ? `${cidadeUf}, ` : ""}${ctx.criadoEm.getDate()} de ${MESES_EXTENSO[ctx.criadoEm.getMonth()]} de ${ctx.criadoEm.getFullYear()}`;

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

      {/* 8 — Geração em 25 anos + aceite e assinaturas */}
      <Pagina titulo="Geração e aceite" numero={8} total={TOTAL}>
        <H2>Geração estimada — 25 anos</H2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3mm", margin: "0 0 3mm" }}>
          {[
            ["Geração no 1º ano", `${formatarNumero(primeiroAno?.geracaoKwh ?? 0, 0)} kWh`],
            [`Geração no ${ultimoAno?.ano ?? 25}º ano`, `${formatarNumero(ultimoAno?.geracaoKwh ?? 0, 0)} kWh`],
            ["Total em 25 anos", `${formatarNumero(geracaoTotal25, 0)} kWh`],
          ].map(([rot, val]) => (
            <div key={rot} style={{ border: `0.3mm solid ${COR_PRIMARIA}`, borderRadius: "2mm", padding: "2mm 3mm" }}>
              <div style={{ fontSize: "8.5pt", color: COR_SUAVE }}>{rot}</div>
              <div style={{ fontSize: "12pt", fontWeight: 700, color: COR_FORTE }}>{val}</div>
            </div>
          ))}
        </div>
        <GraficoAnual projecao={r.projecao} consumoAnual={consumoAnual} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5mm", marginTop: "2mm" }}>
          {[metade1, metade2].map((bloco, k) => (
            <table key={k} style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt" }}>
              <thead>
                <tr>
                  {["Ano", "Geração (kWh)", "% inicial"].map((c, ci) => (
                    <th key={c} style={{ background: COR_FORTE, color: "#fff", padding: "1mm 2mm", fontWeight: 600, textAlign: ci === 0 ? "center" : "right" }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bloco.map((p, ri) => (
                  <tr key={p.ano} style={{ background: ri % 2 ? "#f7f7f5" : "#fff" }}>
                    <td style={{ padding: "0.8mm 2mm", textAlign: "center", borderBottom: "0.2mm solid #ececec" }}>{p.ano}</td>
                    <td style={{ padding: "0.8mm 2mm", textAlign: "right", borderBottom: "0.2mm solid #ececec" }}>{formatarNumero(p.geracaoKwh, 0)}</td>
                    <td style={{ padding: "0.8mm 2mm", textAlign: "right", borderBottom: "0.2mm solid #ececec" }}>{formatarNumero(p.fatorDegradacao * 100)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
        <p style={{ fontSize: "8pt", color: COR_SUAVE, margin: "2mm 0 0" }}>
          Geração com degradação de {formatarNumero(PREMISSAS.degradacaoAnualPct)} % ao ano a partir do 2º ano, sobre a geração inicial de {formatarNumero(r.geracaoAnualKwh, 0)} kWh/ano ({formatarNumero(r.potenciaRealKwp)} kWp).
        </p>

        <div style={{ marginTop: "5mm", borderTop: `0.5mm solid ${COR_PRIMARIA}`, paddingTop: "3mm" }}>
          <div style={{ fontSize: "9pt", lineHeight: 1.5, textAlign: "justify" }}>
            <b>Aceite da proposta nº {ctx.numero ?? "-"}:</b> sistema fotovoltaico de {kwp} kWp, no valor total de <b>{formatarBRL(r.valorTotal)}</b>, válida até {formatarDataBR(d.validade)}. {localData}.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6mm" }}>
            <Assinatura papel="CLIENTE" nome={t(d.clienteNome)} detalhe={d.clienteCpfCnpj.trim() ? `CPF/CNPJ: ${d.clienteCpfCnpj}` : undefined} />
            <Assinatura papel="ENGENHEIRO ELETRICISTA" nome={t(d.engenheiroNome)} detalhe={d.engenheiroRegistro?.trim() ? d.engenheiroRegistro : undefined} />
            <Assinatura papel="EMPRESA" nome={t(CONTRATADA.razaoSocial)} detalhe={CONTRATADA.cnpj.trim() ? `CNPJ: ${CONTRATADA.cnpj}` : undefined} />
          </div>
        </div>
      </Pagina>
    </>
  );
}
