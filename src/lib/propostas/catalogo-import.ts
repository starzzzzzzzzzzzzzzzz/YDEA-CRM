import type { FaseRede } from "./types";

export type ModuloImportado = {
  marca: string;
  modelo: string;
  potenciaW: number;
  larguraMm?: number;
  comprimentoMm?: number;
  valorUnitario?: number;
  garantiaDesempenhoAnos?: number;
  garantiaFabricacaoAnos?: number;
};

export type InversorImportado = {
  marca: string;
  modelo: string;
  potenciaKw: number;
  tensaoSaida: string;
  fase: FaseRede;
  potenciaMaximaVA?: number;
  valorUnitario?: number;
  garantiaFabricacaoAnos?: number;
};

export type ResultadoImportacao<T> = { itens: T[]; erros: string[] };

/** "1.234,56" / "1234,56" / "1234.56" → número; vazio → undefined; lixo → NaN. */
export function numeroBR(v: string | undefined): number | undefined {
  const s = (v ?? "").trim().replace(/^R\$\s*/i, "");
  if (!s) return undefined;
  const n = s.includes(",") ? parseFloat(s.replace(/\./g, "").replace(",", ".")) : parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

function celulas(linha: string): string[] {
  const sep = linha.includes("\t") ? "\t" : linha.includes(";") ? ";" : ",";
  return linha.split(sep).map((c) => c.trim());
}

function faseDe(v: string | undefined): FaseRede {
  const t = (v ?? "").toLowerCase();
  if (t.startsWith("tri")) return "trifasico";
  if (t.startsWith("bi")) return "bifasico";
  return "monofasico";
}

function linhasDeDados(texto: string, colunaNumerica: number): { n: number; c: string[] }[] {
  const linhas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out = linhas.map((l, i) => ({ n: i + 1, c: celulas(l) }));
  // Descarta o cabeçalho (a coluna de potência não é número).
  if (out.length > 0 && Number.isNaN(numeroBR(out[0].c[colunaNumerica]) ?? 0)) out.shift();
  return out;
}

/** Colunas: marca; modelo; potência (W); largura (mm); comprimento (mm); valor (R$); garantia desempenho (anos); garantia fabricação (anos). */
export function importarModulos(texto: string): ResultadoImportacao<ModuloImportado> {
  const itens: ModuloImportado[] = [];
  const erros: string[] = [];
  for (const { n, c } of linhasDeDados(texto, 2)) {
    const [marca, modelo] = c;
    const [pot, larg, comp, valor, gDes, gFab] = [2, 3, 4, 5, 6, 7].map((i) => numeroBR(c[i]));
    if (!marca || !modelo) { erros.push(`Linha ${n}: marca e modelo são obrigatórios.`); continue; }
    if (!pot || Number.isNaN(pot) || pot <= 0) { erros.push(`Linha ${n}: potência (W) inválida.`); continue; }
    const extras = [larg, comp, valor, gDes, gFab];
    if (extras.some((x) => x !== undefined && Number.isNaN(x))) { erros.push(`Linha ${n}: algum número está inválido.`); continue; }
    itens.push({ marca, modelo, potenciaW: pot, larguraMm: larg, comprimentoMm: comp, valorUnitario: valor, garantiaDesempenhoAnos: gDes, garantiaFabricacaoAnos: gFab });
  }
  return { itens, erros };
}

/** Colunas: marca; modelo; potência (kW); tensão de saída; fase; potência máxima (VA); valor (R$); garantia fabricação (anos). */
export function importarInversores(texto: string): ResultadoImportacao<InversorImportado> {
  const itens: InversorImportado[] = [];
  const erros: string[] = [];
  for (const { n, c } of linhasDeDados(texto, 2)) {
    const [marca, modelo] = c;
    const pot = numeroBR(c[2]);
    const [va, valor, gFab] = [5, 6, 7].map((i) => numeroBR(c[i]));
    if (!marca || !modelo) { erros.push(`Linha ${n}: marca e modelo são obrigatórios.`); continue; }
    if (!pot || Number.isNaN(pot) || pot <= 0) { erros.push(`Linha ${n}: potência (kW) inválida.`); continue; }
    if ([va, valor, gFab].some((x) => x !== undefined && Number.isNaN(x))) { erros.push(`Linha ${n}: algum número está inválido.`); continue; }
    itens.push({ marca, modelo, potenciaKw: pot, tensaoSaida: c[3] || "V220", fase: faseDe(c[4]), potenciaMaximaVA: va, valorUnitario: valor, garantiaFabricacaoAnos: gFab });
  }
  return { itens, erros };
}
