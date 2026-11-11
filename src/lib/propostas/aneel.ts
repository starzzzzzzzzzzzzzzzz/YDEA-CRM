/**
 * Leitura das tarifas (TE, TUSD e Fio B) a partir dos dados abertos da ANEEL.
 * Só interpretação das linhas — a busca na rede fica em src/app/api/tarifas/route.ts.
 *
 * ⚠ Os nomes de coluna e de componente abaixo seguem o dicionário de dados publicado pela ANEEL,
 * mas a interpretação foi escrita SEM acesso à API real. Por isso tudo é tolerante (sem acento,
 * sem maiúscula, nome de coluna por aproximação) e o resultado devolve `avisos` e `diagnostico`.
 */

export type LinhaAneel = Record<string, unknown>;

export type TarifasAneel = {
  distribuidora: string;
  subgrupo: string;
  /** Início da vigência (ISO) das tarifas usadas. */
  vigenciaInicio: string;
  /** R$/kWh, sem impostos. */
  te: number;
  tusd: number;
  /** null = componente Fio B não encontrado (informar manualmente). */
  fioB: number | null;
  avisos: string[];
};

export function normalizar(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "COSERN - Neoenergia Cosern" → "COSERN" (a sigla que a ANEEL usa). */
export function siglaDaConcessionaria(texto: string): string {
  return texto.split(/\s+-\s+/)[0].trim().toUpperCase();
}

/** Acha o valor de uma coluna pelo nome aproximado (ex.: "subgrupo" casa com DscSubGrupoTarifario). */
function coluna(l: LinhaAneel, ...trechos: string[]): unknown {
  for (const k of Object.keys(l)) {
    const nk = normalizar(k);
    if (trechos.every((t) => nk.includes(t))) return l[k];
  }
  return undefined;
}

/** R$/MWh → R$/kWh com 6 casas (as telas usam 6 casas; evita 0,38897000000000004). */
function mwhParaKwh(v: number): number {
  return Math.round(v * 1000) / 1_000_000;
}

/** "123,45" ou "123.45" ou 123.45 → 123.45. */
export function numeroAneel(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string" || !v.trim()) return null;
  const s = v.trim();
  const n = s.includes(",") ? parseFloat(s.replace(/\./g, "").replace(",", ".")) : parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Aceita "2026-04-22" e "2026-04-22T00:00:00". */
function isoData(v: unknown): string {
  const m = String(v ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function ehAgente(l: LinhaAneel, sigla: string): boolean {
  const alvo = normalizar(sigla);
  // coluna do agente: SigAgente / SigNomeAgente (mas nunca a "Acessante")
  const chave = Object.keys(l).find((k) => {
    const nk = normalizar(k);
    return nk.includes("agente") && !nk.includes("acessante") && nk.startsWith("sig");
  });
  return chave ? normalizar(l[chave]).includes(alvo) : false;
}

type Filtro = { subgrupo: string; hoje: string };

function filtrarVigentes(linhas: LinhaAneel[], sigla: string, f: Filtro): LinhaAneel[] {
  const base = linhas.filter((l) => {
    if (!ehAgente(l, sigla)) return false;
    if (!normalizar(coluna(l, "base", "tarifaria")).includes("aplicacao")) return false;
    if (!normalizar(coluna(l, "subgrupo")).startsWith(normalizar(f.subgrupo))) return false;
    if (!normalizar(coluna(l, "modalidade")).includes("convencional")) return false;
    const posto = normalizar(coluna(l, "posto"));
    if (posto && !posto.includes("nao se aplica")) return false;
    const unidade = normalizar(coluna(l, "unidade"));
    if (unidade && !unidade.includes("mwh")) return false;
    return true;
  });

  // Vigência: a mais recente que já começou e ainda não terminou.
  const vigentes = base.filter((l) => {
    const ini = isoData(coluna(l, "iniciovigencia"));
    const fim = isoData(coluna(l, "fimvigencia"));
    return ini !== "" && ini <= f.hoje && (fim === "" || fim >= f.hoje);
  });
  const candidatas = vigentes.length ? vigentes : base;
  const maisRecente = candidatas.reduce((m, l) => {
    const ini = isoData(coluna(l, "iniciovigencia"));
    return ini > m ? ini : m;
  }, "");
  return candidatas.filter((l) => isoData(coluna(l, "iniciovigencia")) === maisRecente);
}

/** Prefere a linha "geral" (sem detalhe/baixa renda). */
function preferirGeral(linhas: LinhaAneel[]): LinhaAneel[] {
  const geral = linhas.filter((l) => {
    const det = normalizar(coluna(l, "detalhe"));
    return !det || det.includes("nao se aplica");
  });
  return geral.length ? geral : linhas;
}

/**
 * TE e TUSD vêm do conjunto "tarifas-homologadas" (colunas VlrTE e VlrTUSD, em R$/MWh);
 * o Fio B vem do conjunto "componentes-tarifarias" (linha cujo componente é o Fio B).
 */
export function interpretarTarifas(args: {
  homologadas: LinhaAneel[];
  componentes: LinhaAneel[];
  sigla: string;
  subgrupo: string;
  hoje: string; // ISO
}): TarifasAneel | { erro: string } {
  const { sigla, subgrupo, hoje } = args;
  const avisos: string[] = [];

  const hom = preferirGeral(filtrarVigentes(args.homologadas, sigla, { subgrupo, hoje }));
  if (hom.length === 0) {
    return { erro: `Nenhuma tarifa vigente encontrada para ${sigla} / ${subgrupo} na base da ANEEL.` };
  }

  const pares = hom
    .map((l) => ({ te: numeroAneel(coluna(l, "vlrte")), tusd: numeroAneel(coluna(l, "vlrtusd")) }))
    .filter((p): p is { te: number; tusd: number } => p.te !== null && p.tusd !== null && (p.te > 0 || p.tusd > 0));
  if (pares.length === 0) return { erro: "Linhas encontradas, mas sem valores de TE/TUSD legíveis." };
  if (new Set(pares.map((p) => `${p.te}|${p.tusd}`)).size > 1) {
    avisos.push("Havia mais de uma tarifa possível para este subgrupo; foi usada a primeira. Confira com a fatura.");
  }
  const { te, tusd } = pares[0];
  const vigenciaInicio = isoData(coluna(hom[0], "iniciovigencia"));

  // Fio B
  const comp = filtrarVigentes(args.componentes, sigla, { subgrupo, hoje }).filter((l) => {
    const nome = normalizar(coluna(l, "componente", "tarifario"));
    return nome.includes("fio b") || nome.includes("fiob") || nome.includes("fio_b");
  });
  let fioB: number | null = null;
  if (comp.length > 0) {
    const v = numeroAneel(coluna(comp[0], "vlrcomponente"));
    if (v !== null) fioB = mwhParaKwh(v);
  }
  if (fioB === null) avisos.push("Fio B não localizado na base da ANEEL — informe manualmente.");

  return { distribuidora: sigla, subgrupo, vigenciaInicio, te: mwhParaKwh(te), tusd: mwhParaKwh(tusd), fioB, avisos };
}
