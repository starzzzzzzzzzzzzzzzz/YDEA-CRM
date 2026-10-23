import type { PropostaDados } from "./types";

const OBRIGATORIO = "Campo obrigatório";

export const ETAPAS_PROPOSTA = ["Dados", "Dimensionamento", "Detalhes", "Pós-dimensionamento", "Proposta"] as const;

/** Erros por campo da etapa (0 = Dados, 1 = Dimensionamento, 2 = Detalhes). Vazio = pode prosseguir. */
export function validarEtapa(d: PropostaDados, etapa: number): Record<string, string> {
  const e: Record<string, string> = {};
  const vazio = (s: string) => !s || !s.trim();

  if (etapa === 0) {
    if (vazio(d.nomeProjeto)) e.nomeProjeto = OBRIGATORIO;
    if (vazio(d.consultorNome)) e.consultorNome = OBRIGATORIO;
    if (vazio(d.enderecoBase)) e.enderecoBase = OBRIGATORIO;
    if (vazio(d.clienteNome)) e.clienteNome = OBRIGATORIO;
    if (vazio(d.usinaCidade)) e.usinaCidade = OBRIGATORIO;
    if (vazio(d.usinaEstado)) e.usinaEstado = OBRIGATORIO;
  }

  if (etapa === 1) {
    if (vazio(d.concessionaria)) e.concessionaria = OBRIGATORIO;
    if (!(d.consumoMedioKwh > 0)) e.consumoMedioKwh = "Informe o consumo médio mensal";
    if (!(d.tarifaTE > 0)) e.tarifaTE = OBRIGATORIO;
    if (!(d.tarifaTUSD > 0)) e.tarifaTUSD = OBRIGATORIO;
    if (!(d.tarifaFioB > 0)) e.tarifaFioB = OBRIGATORIO;
    if (!(d.taxaDesempenhoPct > 0 && d.taxaDesempenhoPct <= 100)) e.taxaDesempenhoPct = "Entre 0 e 100%";
    if (!(d.irradiacaoWhM2Dia > 0)) e.irradiacaoWhM2Dia = OBRIGATORIO;
    if (vazio(d.tipoEstrutura)) e.tipoEstrutura = OBRIGATORIO;
    if (vazio(d.validade)) e.validade = OBRIGATORIO;
  }

  if (etapa === 2) {
    if (vazio(d.modulo.marca)) e.moduloMarca = OBRIGATORIO;
    if (vazio(d.modulo.modelo)) e.moduloModelo = OBRIGATORIO;
    if (!(d.modulo.potenciaW > 0)) e.moduloPotencia = OBRIGATORIO;
    const inversorIncompleto = d.inversores.some(
      (i) => vazio(i.marca) || vazio(i.modelo) || !(i.potenciaKw > 0) || !(i.valorUnitario > 0) || !(i.quantidade > 0)
    );
    if (d.inversores.length === 0 || inversorIncompleto) {
      e.inversores = "Preencha marca, modelo, potência, valor e quantidade de todos os inversores";
    }
  }

  return e;
}
