import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { interpretarTarifas, siglaDaConcessionaria, type LinhaAneel, type TarifasAneel } from "@/lib/propostas/aneel";
import { hojeISO } from "@/lib/propostas/proposal-text";

export const runtime = "nodejs";

const ANEEL = "https://dadosabertos.aneel.gov.br/api/3/action";
/** Conjunto "Tarifas de aplicação das distribuidoras" (TE e TUSD totais). Usado se a busca pelo nome falhar. */
const RESOURCE_HOMOLOGADAS_FALLBACK = "fcf2906c-7c32-4b9b-a637-054e7a5234f4";
const CABECALHOS = { "User-Agent": "YDEA-CRM/1.0 (+tarifas)", Accept: "application/json" };

// Cache em memória (a ANEEL atualiza semanalmente; a tarifa muda no máximo 1x por ano por distribuidora).
const CACHE = new Map<string, { em: number; valor: TarifasAneel }>();
const TTL_MS = 12 * 60 * 60 * 1000;

type Recurso = { id: string; name?: string; format?: string; datastore_active?: boolean };

async function json(url: string): Promise<unknown> {
  const r = await fetch(url, { headers: CABECALHOS, cache: "no-store", signal: AbortSignal.timeout(25_000) });
  if (!r.ok) throw new Error(`ANEEL respondeu ${r.status}`);
  return r.json();
}

async function recursosDoConjunto(conjunto: string): Promise<Recurso[]> {
  const d = (await json(`${ANEEL}/package_show?id=${conjunto}`)) as { result?: { resources?: Recurso[] } };
  return d.result?.resources ?? [];
}

async function linhas(resourceId: string, sigla: string): Promise<LinhaAneel[]> {
  const url = `${ANEEL}/datastore_search?resource_id=${resourceId}&q=${encodeURIComponent(sigla)}&limit=20000`;
  const d = (await json(url)) as { result?: { records?: LinhaAneel[] } };
  return d.result?.records ?? [];
}

export async function GET(req: NextRequest) {
  const idToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!idToken) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try {
    await adminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const concessionaria = req.nextUrl.searchParams.get("concessionaria") ?? "";
  const subgrupo = (req.nextUrl.searchParams.get("subgrupo") ?? "B1").toUpperCase();
  const sigla = siglaDaConcessionaria(concessionaria);
  if (!/^[A-Z0-9][A-Z0-9 .\-]{1,29}$/.test(sigla) || !/^B[1-4]$/.test(subgrupo)) {
    return NextResponse.json({ error: "Informe a concessionária e o perfil (B1, B2 ou B3)." }, { status: 400 });
  }

  const chave = `${sigla}|${subgrupo}`;
  const emCache = CACHE.get(chave);
  if (emCache && Date.now() - emCache.em < TTL_MS) return NextResponse.json({ tarifas: emCache.valor, cache: true });

  try {
    const ano = new Date().getFullYear();

    // TE e TUSD: conjunto "tarifas homologadas"
    let idHomologadas = RESOURCE_HOMOLOGADAS_FALLBACK;
    try {
      const rec = (await recursosDoConjunto("tarifas-distribuidoras-energia-eletrica")).find(
        (r) => /tarifas-homologadas/i.test(r.name ?? "") && /csv/i.test(r.format ?? "") && r.datastore_active !== false
      );
      if (rec) idHomologadas = rec.id;
    } catch {
      /* usa o id de reserva */
    }

    // Fio B: conjunto "componentes tarifárias" — um arquivo por ano (o do ano atual e o anterior,
    // porque a vigência de janeiro a março ainda pode ser a do ano passado).
    const idsComponentes = (await recursosDoConjunto("componentes-tarifarias"))
      .filter((r) => r.datastore_active && new RegExp(`componentes-tarifarias-(${ano}|${ano - 1})\\.csv`, "i").test(r.name ?? ""))
      .map((r) => r.id);

    const [homologadas, ...componentes] = await Promise.all([
      linhas(idHomologadas, sigla),
      ...idsComponentes.map((id) => linhas(id, sigla)),
    ]);

    const resultado = interpretarTarifas({ homologadas, componentes: componentes.flat(), sigla, subgrupo, hoje: hojeISO() });
    if ("erro" in resultado) {
      return NextResponse.json(
        { error: resultado.erro, diagnostico: { linhasHomologadas: homologadas.length, linhasComponentes: componentes.flat().length, arquivosComponentes: idsComponentes.length } },
        { status: 404 }
      );
    }
    CACHE.set(chave, { em: Date.now(), valor: resultado });
    return NextResponse.json({ tarifas: resultado });
  } catch (err) {
    console.error("Erro ao buscar tarifas na ANEEL:", err);
    return NextResponse.json({ error: "Não foi possível consultar a ANEEL agora. Informe as tarifas manualmente." }, { status: 502 });
  }
}
