export interface ItemComplementarInput {
  nome: string;
  operacao: 'Valor fixo' | 'Percentual material' | 'Percentual Total' | 'Personalizado';
  valorUnitario: number;
  quantidade: number;
  aliquotaImposto: number; // Ex: 0.1358 para 13,58%
}

export interface InputDimensionamentoAvancado {
  tipoFase: 'monofasico' | 'bifasico' | 'trifasico';
  consumoMensal: number;
  irradiancia: number;
  taxaDesempenho: number;
  potenciaModuloW: number;
  areaModuloM2: number;
  valorKitMaterial: number;
  itensComplementares: ItemComplementarInput[];
  percentualComissao: number; // Ex: 0.03 para 3%
}

export interface ResultadoCalculoSolarAvancado {
  geracaoEspecifica: number;
  kwpNecessario: number;
  qtdModulos: number;
  kwpReal: number;
  areaEstimada: number;
  totalItensSemImposto: number;
  totalImpostoPago: number;
  totalItensComImposto: number;
  valorComissao: number;
  valorTotalProposta: number;
  precoPorKwp: number;
  detalhesItens: Array<{
    nome: string;
    valorTotal: number;
    impostoPago: number;
    valorComImposto: number;
  }>;
}

export function calcularPropostaSolarAvancada(input: InputDimensionamentoAvancado): ResultadoCalculoSolarAvancado {
  // A. Custo de disponibilidade baseado na fase da rede (kWh)
  const custoDisponibilidade = 
    input.tipoFase === 'monofasico' ? 30 :
    input.tipoFase === 'bifasico' ? 50 : 100;

  // B. Geração Específica (kWh/kWp-mês)
  const geracaoEspecifica = input.irradiancia * (365 / 12) * input.taxaDesempenho;

  // C. kWp Necessário
  const consumoAjustado = Math.max(0, input.consumoMensal - custoDisponibilidade);
  const kwpNecessario = geracaoEspecifica > 0 ? consumoAjustado / geracaoEspecifica : 0;

  // D. Quantidade de Módulos (arredondado para cima)
  const qtdModulos = input.potenciaModuloW > 0 
    ? Math.ceil((kwpNecessario * 1000) / input.potenciaModuloW) 
    : 0;

  // E. Potência Real Instalada da Usina (kWp)
  const kwpReal = (qtdModulos * input.potenciaModuloW) / 1000;

  // F. Área Estimada Ocupada (m²)
  const areaEstimada = qtdModulos * input.areaModuloM2;

  // G. Cálculo dos Itens Complementares com Gross-Up de Impostos individual ou geral
  let totalItensSemImposto = 0;
  let totalImpostoPago = 0;
  let totalItensComImposto = 0;

  const detalhesItens = input.itensComplementares.map(item => {
    let baseCalculo = item.valorUnitario * item.quantidade;

    if (item.operacao === 'Percentual material') {
      baseCalculo = input.valorKitMaterial * (item.valorUnitario / 100) * item.quantidade;
    }

    // Gross-up do imposto do item
    const valorComImposto = baseCalculo / (1 - item.aliquotaImposto);
    const impostoPago = valorComImposto - baseCalculo;

    totalItensSemImposto += baseCalculo;
    totalImpostoPago += impostoPago;
    totalItensComImposto += valorComImposto;

    return {
      nome: item.nome,
      valorTotal: Number(baseCalculo.toFixed(2)),
      impostoPago: Number(impostoPago.toFixed(2)),
      valorComImposto: Number(valorComImposto.toFixed(2))
    };
  });

  // H. Subtotal (Kit + Itens Complementares com Imposto)
  const subtotalProposta = input.valorKitMaterial + totalItensComImposto;

  // I. Comissão do Vendedor via Gross-Up
  const valorTotalProposta = subtotalProposta / (1 - input.percentualComissao);
  const valorComissao = valorTotalProposta * input.percentualComissao;

  // J. Preço por kWp
  const precoPorKwp = kwpReal > 0 ? valorTotalProposta / kwpReal : 0;

  return {
    geracaoEspecifica: Number(geracaoEspecifica.toFixed(2)),
    kwpNecessario: Number(kwpNecessario.toFixed(2)),
    qtdModulos,
    kwpReal: Number(kwpReal.toFixed(2)),
    areaEstimada: Number(areaEstimada.toFixed(2)),
    totalItensSemImposto: Number(totalItensSemImposto.toFixed(2)),
    totalImpostoPago: Number(totalImpostoPago.toFixed(2)),
    totalItensComImposto: Number(totalItensComImposto.toFixed(2)),
    valorComissao: Number(valorComissao.toFixed(2)),
    valorTotalProposta: Number(valorTotalProposta.toFixed(2)),
    precoPorKwp: Number(precoPorKwp.toFixed(2)),
    detalhesItens
  };
}