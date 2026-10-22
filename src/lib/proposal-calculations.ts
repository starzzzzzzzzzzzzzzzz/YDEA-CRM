import { InputDimensionamento, ResultadoCalculoSolar } from './types';

export function calcularPropostaSolar(input: InputDimensionamento): ResultadoCalculoSolar {
  // A. Custo de disponibilidade baseado na fase da rede (kWh)
  const custoDisponibilidade = 
    input.tipoFase === 'monofasico' ? 30 :
    input.tipoFase === 'bifasico' ? 50 : 100;

  // B. Geração Específica (kWh/kWp-mês)
  const geracaoEspecifica = input.irradiancia * (365 / 12) * input.taxaDesempenho;

  // C. kWp Necessário
  const consumoAjustado = Math.max(0, input.consumoMensal - custoDisponibilidade);
  const kwpNecessario = consumoAjustado / geracaoEspecifica;

  // D. Quantidade de Módulos (arredondado para cima)
  const qtdModulos = Math.ceil((kwpNecessario * 1000) / input.potenciaModuloW);

  // E. Potência Real Instalada da Usina (kWp)
  const kwpReal = (qtdModulos * input.potenciaModuloW) / 1000;

  // F. Área Estimada Ocupada (m²)
  const areaEstimada = qtdModulos * input.areaModuloM2;

  // G. Imposto Gross-Up dos Itens Complementares (Alíquota de 13.58%)
  const aliquotaImpostoComplementares = 0.1358;
  const complementaresComImposto = input.valorComplementaresBase / (1 - aliquotaImpostoComplementares);

  // H. Mão de Obra de Instalação (R$ 80,00 por módulo)
  const valorInstalacao = qtdModulos * 80;

  // I. Valor sobre o Kit Material (50% sobre o custo do kit)
  const valorSobreKit = input.valorKitMaterial * 0.50;

  // J. Subtotal sem comissão
  const subtotalProposta = input.valorKitMaterial + complementaresComImposto + valorInstalacao + valorSobreKit;

  // K. Comissão do Vendedor via Gross-Up (Alíquota de 3%)
  const aliquotaComissao = 0.03;
  const valorTotalProposta = subtotalProposta / (1 - aliquotaComissao);
  const valorComissao = valorTotalProposta * aliquotaComissao;

  // L. Preço por kWp
  const precoPorKwp = kwpReal > 0 ? valorTotalProposta / kwpReal : 0;

  return {
    geracaoEspecifica: Number(geracaoEspecifica.toFixed(2)),
    kwpNecessario: Number(kwpNecessario.toFixed(2)),
    qtdModulos,
    kwpReal: Number(kwpReal.toFixed(2)),
    areaEstimada: Number(areaEstimada.toFixed(2)),
    complementaresComImposto: Number(complementaresComImposto.toFixed(2)),
    valorInstalacao: Number(valorInstalacao.toFixed(2)),
    valorSobreKit: Number(valorSobreKit.toFixed(2)),
    valorComissao: Number(valorComissao.toFixed(2)),
    valorTotalProposta: Number(valorTotalProposta.toFixed(2)),
    precoPorKwp: Number(precoPorKwp.toFixed(2))
  };
}