import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALIQUOTA_IMPOSTO,
  areaUnitariaM2,
  calcularLinhaComplementar,
  calcularProposta,
  geracaoEspecifica,
  geracaoPorMes,
  grossUp,
  kwpNecessario,
  maoDeObraInstalacao,
  percentualFioB,
  precoComComissao,
  quantidadeModulos,
  round2,
} from "./proposal-calculations";
import {
  adicionarDias,
  formatarDataBR,
  hojeISO,
  preencherPlaceholders,
  temPlaceholderPendente,
  validadePadrao,
  valorOuTraco,
  valorPorExtenso,
} from "./proposal-text";
import { validarEtapa } from "./validacao";
import { TENSAO_PADRAO_POR_FASE, TENSOES_POR_FASE } from "./constants";
import { interpretarTarifas, siglaDaConcessionaria } from "./aneel";
import { importarInversores, importarModulos, numeroBR } from "./catalogo-import";
import type { PropostaDados } from "./types";

/**
 * Os valores de referência abaixo vêm das telas do sistema atual (proposta de teste):
 * consumo 5.000 kWh, monofásico, 75%, 5.788,50 Wh/m²·dia, módulo AE650 (1302×2384 mm).
 */
function dadosDeReferencia(): PropostaDados {
  return {
    tipoProposta: "solar",
    modeloPrecificacao: "nova",
    nomeProjeto: "TESTE",
    consultorNome: "",
    consultorEmail: "",
    consultorTelefone: "",
    enderecoBase: "",
    clienteNome: "Card Modelo",
    clienteCpfCnpj: "",
    clienteEmail: "",
    clienteContato: "",
    clienteOrganizacao: "",
    clienteProfissao: "",
    clienteEndereco: "",
    usarEnderecoCliente: false,
    usinaRua: "",
    usinaNumero: "",
    usinaBairro: "",
    usinaCidade: "",
    usinaEstado: "",
    usinaCep: "",
    usinaObservacao: "",
    concessionaria: "COSERN",
    perfilConcessionaria: "B1",
    codigoUC: "",
    fase: "monofasico",
    tensao: "V220",
    consumoMedioKwh: 5000,
    tarifaTE: 0.388971,
    tarifaTUSD: 0.639396,
    tarifaFioB: 0.353918,
    taxasAntesSolar: 0,
    taxasDepoisSolar: 0,
    considerarCreditoNoPayback: true,
    taxaDesempenhoPct: 75,
    irradiacaoWhM2Dia: 5788.5,
    tipoEstrutura: "Telhado Laje",
    incluirEstruturaEm: "kit",
    maoDeObra: "",
    validade: "2026-10-29",
    observacao: "",
    modoKit: "manual",
    modulo: { marca: "AE SOLAR", modelo: "AE650ME-132BD", potenciaW: 650, larguraMm: 1302, comprimentoMm: 2384, valorUnitario: 0 },
    inversores: [
      { id: "i1", marca: "WEG", modelo: "SIW200G M050 W1", potenciaKw: 5, tensaoSaida: "V220", fase: "monofasico", valorUnitario: 2798.05, quantidade: 1 },
    ],
    outrosKit: [],
    complementares: [
      { id: "c1", nome: "ART", quantidade: 1, valorUnitario: 272, aplicaImposto: true },
      { id: "c2", nome: "Material CA", quantidade: 1, valorUnitario: 500, aplicaImposto: true },
    ],
    incluirInstalacao: true,
    incluirComissao: false,
    osNumero: "",
    osDataInicio: "",
    osDataFim: "",
    osColaborador: "",
    osColaboradorCpf: "",
    infoContrato: "",
    nacionalidade: "Brasileiro(a)",
    clausula211: "",
    clausula212: "",
  };
}

describe("dimensionamento", () => {
  it("geração específica = 132,05 kWh/kWp·mês (igual à tela)", () => {
    assert.equal(round2(geracaoEspecifica(5788.5, 75)), 132.05);
  });

  it("kWp necessário = 37,64 e 58 módulos de 650 W", () => {
    const g = geracaoEspecifica(5788.5, 75);
    const kwp = kwpNecessario(5000, "monofasico", g);
    assert.equal(round2(kwp), 37.64);
    assert.equal(quantidadeModulos(kwp, 650), 58);
  });

  it("custo de disponibilidade varia com a fase", () => {
    const g = 100;
    assert.equal(kwpNecessario(1000, "monofasico", g), 9.7);
    assert.equal(kwpNecessario(1000, "bifasico", g), 9.5);
    assert.equal(kwpNecessario(1000, "trifasico", g), 9);
  });

  it("consumo abaixo do custo de disponibilidade não dimensiona nada", () => {
    assert.equal(kwpNecessario(20, "monofasico", 132), 0);
    assert.equal(quantidadeModulos(0, 650), 0);
  });

  it("não arredonda para cima por ruído de ponto flutuante", () => {
    assert.equal(quantidadeModulos(0.65 * 58, 650), 58);
  });

  it("área do módulo AE650 = 3,10 m²", () => {
    assert.equal(round2(areaUnitariaM2(1302, 2384)), 3.1);
  });
});

describe("precificação", () => {
  it("gross-up de 13,58% reproduz os itens da tela", () => {
    assert.equal(calcularLinhaComplementar({ id: "a", nome: "ART", quantidade: 1, valorUnitario: 272, aplicaImposto: true }).valorComImposto, 314.74);
    assert.equal(calcularLinhaComplementar({ id: "a", nome: "ART", quantidade: 1, valorUnitario: 272, aplicaImposto: true }).impostoPago, 42.74);
    assert.equal(grossUp(4640, ALIQUOTA_IMPOSTO), 5369.13);
    assert.equal(grossUp(500, ALIQUOTA_IMPOSTO), 578.57);
    assert.equal(grossUp(1.03, ALIQUOTA_IMPOSTO), 1.19);
  });

  it("item sem imposto não é majorado", () => {
    const l = calcularLinhaComplementar({ id: "a", nome: "X", quantidade: 2, valorUnitario: 10, aplicaImposto: false });
    assert.equal(l.valorComImposto, 20);
    assert.equal(l.impostoPago, 0);
  });

  it("instalação = R$ 80 × módulos", () => {
    assert.equal(maoDeObraInstalacao(58), 4640);
  });

  it("comissão de 3% embutida por gross-up", () => {
    assert.equal(precoComComissao(970), 1000);
  });

  it("alíquota inválida lança erro", () => {
    assert.throws(() => grossUp(100, 1));
  });
});

describe("proposta completa (caso de referência)", () => {
  const r = calcularProposta(dadosDeReferencia(), new Date(2026, 9, 22));

  it("dimensionamento", () => {
    assert.equal(r.quantidadeModulos, 58);
    assert.equal(round2(r.potenciaRealKwp), 37.7);
    assert.equal(round2(r.areaTotalM2), 180.03);
    assert.equal(Math.round(r.geracaoMensalKwh), 4978); // "4,98 MWh" na tela
  });

  it("valor do kit e instalação", () => {
    assert.equal(r.valorKit, 2798.05);
    assert.equal(r.instalacao?.valorComImposto, 5369.13);
  });

  it("total = kit + complementares com imposto + instalação", () => {
    // 2798,05 + (314,74 + 578,57) + 5369,13
    assert.equal(r.valorTotal, round2(2798.05 + 314.74 + 578.57 + 5369.13));
  });

  it("preço por kWp = total / potência real", () => {
    assert.equal(r.precoPorKwp, round2(r.valorTotal / r.potenciaRealKwp));
  });

  it("CO₂ em toneladas/ano", () => {
    assert.ok(r.reducaoCo2ToneladasAno > 0 && r.reducaoCo2ToneladasAno < 100);
  });

  it("quantidade manual de módulos prevalece sobre a calculada", () => {
    const d = dadosDeReferencia();
    d.modulo.quantidade = 60;
    const m = calcularProposta(d, new Date(2026, 9, 22));
    assert.equal(m.quantidadeModulos, 60);
    assert.equal(m.quantidadeModulosCalculada, 58);
    assert.equal(m.instalacao?.valorUnitario, 4800);
  });

  it("comissão só entra no total quando ativada", () => {
    const d = dadosDeReferencia();
    const sem = calcularProposta(d, new Date(2026, 9, 22));
    d.incluirComissao = true;
    const com = calcularProposta(d, new Date(2026, 9, 22));
    assert.equal(sem.comissao, 0);
    assert.ok(com.valorTotal > sem.valorTotal);
    assert.equal(com.comissao, round2(com.valorTotal - sem.valorTotal));
  });
});

describe("projeção financeira", () => {
  const r = calcularProposta(dadosDeReferencia(), new Date(2026, 9, 22));

  it("tem 25 anos e a geração só cai com a degradação", () => {
    assert.equal(r.projecao.length, 25);
    for (let i = 1; i < r.projecao.length; i++) {
      assert.ok(r.projecao[i].geracaoKwh < r.projecao[i - 1].geracaoKwh);
    }
  });

  it("payback existe, é positivo e o fluxo acumulado termina positivo", () => {
    assert.ok(r.paybackAnos !== null && r.paybackAnos > 0 && r.paybackAnos < 25);
    assert.ok(r.projecao[24].fluxoAcumulado > 0);
  });

  it("Fio B: transição da Lei 14.300", () => {
    assert.equal(percentualFioB(2026), 0.6);
    assert.equal(percentualFioB(2029), 1);
    assert.equal(percentualFioB(2040), 1);
  });

  it("geração mensal soma a anual", () => {
    const soma = geracaoPorMes(60000, 2026).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(soma - 60000) < 1e-6);
  });
});

describe("datas e validade", () => {
  it("validade nasce como hoje + 7 dias", () => {
    assert.equal(validadePadrao(new Date(2026, 9, 22)), "2026-10-29");
  });

  it("virada de mês e de ano", () => {
    assert.equal(adicionarDias("2026-12-28", 7), "2027-01-04");
    assert.equal(adicionarDias("2026-10-28", 7), "2026-11-04");
  });

  it("hoje à noite continua sendo o mesmo dia (sem deslocar por UTC)", () => {
    assert.equal(hojeISO(new Date(2026, 9, 22, 23, 45)), "2026-10-22");
  });

  it("formata dd/mm/aaaa e usa traço quando vazio", () => {
    assert.equal(formatarDataBR("2026-10-29"), "29/10/2026");
    assert.equal(formatarDataBR(""), "-");
    assert.equal(formatarDataBR(undefined), "-");
  });
});

describe("sanitização de placeholders", () => {
  it("campo vazio vira traço, nunca a tag crua", () => {
    const out = preencherPlaceholders("Profissão: {{profissao}} | Início: {{data_ini}}", { profissao: "", data_ini: undefined });
    assert.equal(out, "Profissão: - | Início: -");
  });

  it("preenche valores e caminhos aninhados", () => {
    assert.equal(preencherPlaceholders("{{cliente.nome}} / {{uc}}", { cliente: { nome: "Maria" }, uc: 123 }), "Maria / 123");
  });

  it("valor 0 é válido (não vira traço)", () => {
    assert.equal(valorOuTraco(0), "0");
    assert.equal(valorOuTraco("  "), "-");
  });

  it("detecta cláusula ainda com marcador do modelo", () => {
    assert.ok(temPlaceholderPendente("Pagamento no valor de R$ 00000 (VALOR POR ESCRITO) à vista"));
    assert.ok(temPlaceholderPendente("através de FORMA DE PAGAMENTO"));
    assert.ok(temPlaceholderPendente("Olá {{nome}}"));
    assert.ok(!temPlaceholderPendente("Pagamento de R$ 5.000,00 (cinco mil reais) via PIX"));
  });
});

describe("valor por extenso", () => {
  const casos: [number, string][] = [
    [0, "zero reais"],
    [1, "um real"],
    [0.01, "um centavo"],
    [0.77, "setenta e sete centavos"],
    [1.01, "um real e um centavo"],
    [100, "cem reais"],
    [101, "cento e um reais"],
    [1000, "mil reais"],
    [1500, "mil e quinhentos reais"],
    [2050, "dois mil e cinquenta reais"],
    [10977.77, "dez mil, novecentos e setenta e sete reais e setenta e sete centavos"],
    [2_000_000, "dois milhões de reais"],
    [2_500_000, "dois milhões e quinhentos mil reais"],
  ];
  for (const [valor, esperado] of casos) {
    it(`${valor} → ${esperado}`, () => assert.equal(valorPorExtenso(valor), esperado));
  }
});

describe("validação das etapas", () => {
  it("etapa 1 vazia exige os campos principais", () => {
    const e = validarEtapa(dadosDeReferencia(), 0);
    // O caso de referência já tem projeto e cliente; faltam consultor, filial e cidade/UF da usina.
    assert.deepEqual(Object.keys(e).sort(), ["consultorNome", "enderecoBase", "usinaCidade", "usinaEstado"]);
  });

  it("etapa 2 do caso de referência passa", () => {
    assert.deepEqual(validarEtapa(dadosDeReferencia(), 1), {});
  });

  it("etapa 3 do caso de referência passa; inversor sem valor não", () => {
    assert.deepEqual(validarEtapa(dadosDeReferencia(), 2), {});
    const d = dadosDeReferencia();
    d.inversores[0].valorUnitario = 0;
    assert.ok("inversores" in validarEtapa(d, 2));
  });
});

describe("tarifas da ANEEL (linhas no formato do dicionário de dados)", () => {
  const hom = (extra: Record<string, unknown> = {}) => ({
    SigAgente: "COSERN",
    DscBaseTarifaria: "Tarifa de Aplicação",
    DscSubGrupoTarifario: "B1",
    DscModalidadeTarifaria: "Convencional",
    DscDetalheConsumidor: "Não se aplica",
    NomPostoTarifario: "Não se aplica",
    DscUnidade: "R$/MWh",
    DatInicioVigencia: "2026-04-22",
    DatFimVigencia: "2027-04-21",
    VlrTUSD: "639,40",
    VlrTE: "388,97",
    ...extra,
  });
  const comp = (nome: string, valor: string, extra: Record<string, unknown> = {}) => ({
    SigNomeAgente: "COSERN",
    DscBaseTarifaria: "Tarifa de Aplicação",
    DscSubGrupoTarifario: "B1",
    DscModalidadeTarifaria: "Convencional",
    DscPostoTarifario: "Não se aplica",
    DscUnidade: "R$/MWh",
    DatInicioVigencia: "2026-04-22",
    DatFimVigencia: "2027-04-21",
    DscComponenteTarifario: nome,
    VlrComponenteTarifario: valor,
    ...extra,
  });

  it("sigla a partir do texto da concessionária", () => {
    assert.equal(siglaDaConcessionaria("COSERN - Neoenergia Cosern"), "COSERN");
  });

  it("converte R$/MWh em R$/kWh e acha o Fio B", () => {
    const r = interpretarTarifas({
      homologadas: [hom()],
      componentes: [comp("TUSD_Perdas", "10,00"), comp("TUSD_FioB", "353,92")],
      sigla: "COSERN", subgrupo: "B1", hoje: "2026-10-24",
    });
    assert.ok(!("erro" in r));
    if ("erro" in r) return;
    assert.equal(r.te, 0.38897);
    assert.equal(r.tusd, 0.6394);
    assert.equal(r.fioB, 0.35392);
    assert.deepEqual(r.avisos, []);
  });

  it("usa a vigência mais recente e ignora outras linhas (subgrupo, posto, agente)", () => {
    const r = interpretarTarifas({
      homologadas: [
        hom({ DatInicioVigencia: "2025-04-22", DatFimVigencia: "2026-04-21", VlrTE: "300,00" }),
        hom(),
        hom({ DscSubGrupoTarifario: "B3", VlrTE: "999,00" }),
        hom({ NomPostoTarifario: "Ponta", VlrTE: "888,00" }),
        hom({ SigAgente: "ENEL CE", VlrTE: "777,00" }),
      ],
      componentes: [], sigla: "COSERN", subgrupo: "B1", hoje: "2026-10-24",
    });
    assert.ok(!("erro" in r));
    if ("erro" in r) return;
    assert.equal(r.te, 0.38897);
    assert.equal(r.vigenciaInicio, "2026-04-22");
  });

  it("sem Fio B devolve null e avisa (não inventa valor)", () => {
    const r = interpretarTarifas({ homologadas: [hom()], componentes: [comp("TE_Energia", "100,00")], sigla: "COSERN", subgrupo: "B1", hoje: "2026-10-24" });
    assert.ok(!("erro" in r));
    if ("erro" in r) return;
    assert.equal(r.fioB, null);
    assert.equal(r.avisos.length, 1);
  });

  it("distribuidora sem dados devolve erro claro", () => {
    const r = interpretarTarifas({ homologadas: [], componentes: [], sigla: "COSERN", subgrupo: "B1", hoje: "2026-10-24" });
    assert.ok("erro" in r);
  });
});

describe("importação do catálogo", () => {
  it("números no formato brasileiro", () => {
    assert.equal(numeroBR("1.234,56"), 1234.56);
    assert.equal(numeroBR("R$ 2798,05"), 2798.05);
    assert.equal(numeroBR(""), undefined);
    assert.ok(Number.isNaN(numeroBR("abc")));
  });

  it("módulos: ignora cabeçalho e aponta linhas inválidas", () => {
    const r = importarModulos("marca;modelo;potencia\nAE SOLAR;AE650ME-132BD;650;1302;2384;;12;12\nX;Y;zero\n;;650");
    assert.equal(r.itens.length, 1);
    assert.deepEqual(r.itens[0], { marca: "AE SOLAR", modelo: "AE650ME-132BD", potenciaW: 650, larguraMm: 1302, comprimentoMm: 2384, valorUnitario: undefined, garantiaDesempenhoAnos: 12, garantiaFabricacaoAnos: 12 });
    assert.equal(r.erros.length, 2);
  });

  it("inversores: fase e tensão", () => {
    const r = importarInversores("WEG\tSIW200G M050 W1\t5\tV220\tMonofásico\t5500\t2.798,05\t5");
    assert.equal(r.erros.length, 0);
    assert.equal(r.itens[0].fase, "monofasico");
    assert.equal(r.itens[0].valorUnitario, 2798.05);
    assert.equal(r.itens[0].potenciaMaximaVA, 5500);
  });
});

describe("tensão por fase", () => {
  it("a tensão padrão de cada fase é uma tensão permitida para ela", () => {
    for (const fase of ["monofasico", "bifasico", "trifasico"] as const) {
      assert.ok(TENSOES_POR_FASE[fase].includes(TENSAO_PADRAO_POR_FASE[fase]));
    }
  });
});
