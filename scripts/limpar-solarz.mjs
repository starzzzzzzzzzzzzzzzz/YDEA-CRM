// Limpa do CRM os negócios importados da SolarZ que NÃO estão mais em aberto (ganhos e perdidos),
// e as pessoas/organizações que ficaram sem nenhum negócio ligado.
//
// Por padrão roda em MODO DE TESTE: mostra o que seria apagado, mas NÃO apaga nada.
//
// Uso (PowerShell, na pasta do projeto) — uma linha por vez:
//   node scripts/limpar-solarz.mjs                  (teste, não apaga)
//   node scripts/limpar-solarz.mjs --executar       (apaga de verdade; antes salva um backup .json)
//
// Opcional — conferir também com a SolarZ ao vivo (garante que só ficam os que estão ABERTOS lá agora):
//   $env:SOLARZ_TOKEN = "cole-aqui-o-token-de-SOMENTE-LEITURA"
//   node scripts/limpar-solarz.mjs --conferir-solarz
//
// O que é tocado: SOMENTE registros com origem "solarz". Cards criados à mão no CRM, ou pela
// cadeia de funis (Ganho -> próximo funil), não têm essa marca e nunca são apagados.
// Negócios que ganharam anotações/atividades/documentos depois da importação são MANTIDOS
// (aparecem no relatório como "protegidos") para ninguém perder trabalho.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const EXECUTAR = flag("--executar");
const CONFERIR = flag("--conferir-solarz");

const txt = (v) => (v === null || v === undefined ? "" : String(v).trim());

/**
 * Decide o que apagar. Função pura (sem Firebase) para poder ser testada.
 * @param deals     todos os negócios do CRM: { id, ...dados }
 * @param pessoas   todas as pessoas:        { id, ...dados }
 * @param orgs      todas as organizações:   { id, ...dados }
 * @param abertosSolarz  (opcional) Set com os solarzId que estão ABERTOS na SolarZ agora
 * @param protegidos     (opcional) Set com ids de negócios que têm anotações/atividades/documentos
 */
export function planejar({ deals, pessoas, orgs, abertosSolarz = null, protegidos = new Set() }) {
  const dealsSolarz = deals.filter((d) => d.origem === "solarz");

  const motivo = (d) => {
    if (abertosSolarz) return abertosSolarz.has(txt(d.solarzId)) ? null : "não está aberto na SolarZ";
    return d.status === "ganho" ? "ganho" : d.status === "perdido" ? "perdido" : null;
  };

  const apagarDeals = [];
  const protegidosDeals = [];
  for (const d of dealsSolarz) {
    const m = motivo(d);
    if (!m) continue;
    (protegidos.has(d.id) ? protegidosDeals : apagarDeals).push({ deal: d, motivo: m });
  }
  const idsApagar = new Set(apagarDeals.map((x) => x.deal.id));

  // Quem ainda é usado por algum negócio que vai continuar existindo (de qualquer origem).
  const pessoasEmUso = new Set();
  const orgsEmUso = new Set();
  for (const d of deals) {
    if (idsApagar.has(d.id)) continue;
    if (d.pessoaId) pessoasEmUso.add(d.pessoaId);
    if (d.organizacaoId) orgsEmUso.add(d.organizacaoId);
  }
  const apagarPessoas = pessoas.filter((p) => p.origem === "solarz" && !pessoasEmUso.has(p.id));
  const apagarOrgs = orgs.filter((o) => o.origem === "solarz" && !orgsEmUso.has(o.id));

  // Quanto sobra por funil (todos os negócios que ficam, de qualquer origem).
  const sobra = {};
  for (const d of deals) {
    if (idsApagar.has(d.id)) continue;
    const f = (sobra[d.funnelId] ??= { total: 0, solarz: 0, valor: 0 });
    f.total++;
    if (d.origem === "solarz") f.solarz++;
    if ((d.status ?? "aberto") === "aberto") f.valor += Number(d.valor) || 0;
  }

  return { dealsSolarz, apagarDeals, protegidosDeals, apagarPessoas, apagarOrgs, sobra };
}

// ---------- SolarZ (só leitura, só para --conferir-solarz) ----------
async function abertosNaSolarz() {
  const TOKEN = process.env.SOLARZ_TOKEN;
  if (!TOKEN) {
    console.error('\n❌ Falta o token. No PowerShell, rode antes:\n   $env:SOLARZ_TOKEN = "cole-o-token-de-somente-leitura"\n');
    process.exit(1);
  }
  const BASE = (process.env.SOLARZ_BASE_URL || "https://api.crm.solarz.com.br/api").replace(/\/$/, "");
  const abertos = new Set();
  let lidos = 0;
  for (let page = 0; ; page++) {
    const url = new URL(BASE + "/v2/open-api/deal");
    url.searchParams.set("page", page);
    url.searchParams.set("size", 100);
    let r;
    for (let t = 1; t <= 7; t++) {
      const res = await fetch(url, { headers: { authorization: TOKEN, accept: "application/json" } });
      if (res.ok) { r = await res.json(); break; }
      if ((res.status === 429 || res.status >= 500) && t < 7) {
        const pedido = Number(res.headers.get("retry-after"));
        await new Promise((ok) => setTimeout(ok, pedido > 0 ? pedido * 1000 : Math.min(2000 * 2 ** (t - 1), 60000)));
        continue;
      }
      throw new Error(`HTTP ${res.status} lendo negócios da SolarZ`);
    }
    const lote = Array.isArray(r) ? r : r.content ?? [];
    lidos += lote.length;
    for (const n of lote) if (txt(n.status).toUpperCase() === "OPEN") abertos.add(String(n.id));
    process.stdout.write(`\r   SolarZ: ${lidos} negócios lidos, ${abertos.size} abertos`);
    if (Array.isArray(r) || r.last || lote.length === 0) break;
    await new Promise((ok) => setTimeout(ok, Number(process.env.SOLARZ_PAUSA_MS || 1000)));
  }
  process.stdout.write("\n");
  return abertos;
}

// ---------- Firebase ----------
async function iniciarFirebase() {
  const caminho = join(__dirname, "..", "service-account.json");
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const env = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  let chave;
  if (env) chave = JSON.parse(env.startsWith("{") ? env : Buffer.from(env, "base64").toString("utf-8"));
  else if (existsSync(caminho)) chave = JSON.parse(readFileSync(caminho, "utf-8"));
  else {
    console.error("\n❌ Não encontrei o service-account.json na raiz do projeto.\n");
    process.exit(1);
  }
  initializeApp({ credential: cert(chave) });
  return getFirestore();
}

const ler = async (db, colecao) => (await db.collection(colecao).get()).docs.map((d) => ({ id: d.id, ...d.data() }));

/** Negócios que têm anotações, atividades ou documentos (subcoleções) — esses não são apagados. */
async function comConteudo(db, candidatos) {
  const protegidos = new Set();
  let i = 0;
  for (const id of candidatos) {
    const subs = await db.collection("deals").doc(id).listCollections();
    for (const s of subs) {
      const um = await s.limit(1).get();
      if (!um.empty) { protegidos.add(id); break; }
    }
    if (++i % 50 === 0) process.stdout.write(`\r   conferindo anotações... ${i}/${candidatos.length}`);
  }
  process.stdout.write("\n");
  return protegidos;
}

const BRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NOME_FUNIL = {
  comercial: "Comercial", engenharia: "Engenharia", pos_acompanhamento: "Pós - Acompanhamento",
  pos_nps: "Pós - NPS", pos_gestao_energetica: "Pós - Gestão Energética", pos_ampliacao: "Pós - Ampliação e serviços adicionais",
};

async function main() {
  console.log(EXECUTAR ? "▶️  MODO REAL: vai APAGAR do CRM.\n" : "🧪 MODO DE TESTE: nada será apagado.\n");
  const db = await iniciarFirebase();

  console.log("📥 Lendo o CRM...");
  const [deals, pessoas, orgs] = await Promise.all([ler(db, "deals"), ler(db, "pessoas"), ler(db, "organizacoes")]);
  const abertosSolarz = CONFERIR ? await abertosNaSolarz() : null;

  // Primeiro passada sem proteção, só para saber quais candidatos checar por anotações.
  const previa = planejar({ deals, pessoas, orgs, abertosSolarz });
  const protegidos = await comConteudo(db, previa.apagarDeals.map((x) => x.deal.id));
  const plano = planejar({ deals, pessoas, orgs, abertosSolarz, protegidos });

  // ---- relatório (sem dados pessoais) ----
  const porFunil = {};
  for (const { deal, motivo } of plano.apagarDeals) {
    const f = (porFunil[deal.funnelId] ??= { ganho: 0, perdido: 0, outro: 0 });
    if (motivo === "ganho") f.ganho++; else if (motivo === "perdido") f.perdido++; else f.outro++;
  }
  console.log("\n==================== RELATÓRIO ====================");
  console.log(`Negócios no CRM: ${deals.length} (da SolarZ: ${plano.dealsSolarz.length})`);
  console.log(`A apagar: ${plano.apagarDeals.length} negócios | ${plano.apagarPessoas.length} pessoas | ${plano.apagarOrgs.length} organizações`);
  for (const [id, f] of Object.entries(porFunil)) {
    console.log(`   - ${NOME_FUNIL[id] ?? id}: ganhos ${f.ganho}, perdidos ${f.perdido}${f.outro ? `, outros ${f.outro}` : ""}`);
  }
  if (plano.protegidosDeals.length) {
    console.log(`Protegidos (têm anotações/atividades/documentos, ficam no CRM): ${plano.protegidosDeals.length}`);
  }
  console.log("\nO que FICA em cada funil (compare com o que a SolarZ mostra):");
  for (const [id, f] of Object.entries(plano.sobra)) {
    console.log(`   - ${NOME_FUNIL[id] ?? id}: ${f.total} negócios (${f.solarz} da SolarZ) · ${BRL(f.valor)}`);
  }

  if (!EXECUTAR) {
    console.log("\nNada foi apagado (modo de teste). Para apagar: --executar");
    console.log("===================================================");
    return;
  }

  // ---- backup antes de apagar ----
  const arquivo = join(__dirname, "..", `backup-limpeza-solarz-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(arquivo, JSON.stringify({
    deals: plano.apagarDeals.map((x) => x.deal),
    pessoas: plano.apagarPessoas,
    organizacoes: plano.apagarOrgs,
  }, null, 2));
  console.log(`\n💾 Backup salvo em: ${arquivo}`);

  // ---- apagar ----
  let feitos = 0;
  const alvos = [
    ...plano.apagarDeals.map((x) => db.collection("deals").doc(x.deal.id)),
    ...plano.apagarPessoas.map((p) => db.collection("pessoas").doc(p.id)),
    ...plano.apagarOrgs.map((o) => db.collection("organizacoes").doc(o.id)),
  ];
  // Os negócios com anotações/atividades/documentos já ficaram de fora (protegidos), então basta
  // apagar os documentos. O BulkWriter agrupa, controla a velocidade e tenta de novo sozinho.
  const writer = db.bulkWriter();
  let falhas = 0;
  writer.onWriteResult(() => {
    if (++feitos % 25 === 0) process.stdout.write(`\r   apagando... ${feitos}/${alvos.length}`);
  });
  writer.onWriteError((e) => {
    if (e.failedAttempts < 8) return true; // tenta de novo
    falhas++;
    console.error(`\n❌ ${e.documentRef.path}: ${e.message}`);
    return false;
  });
  for (const ref of alvos) writer.delete(ref);
  await writer.close();
  process.stdout.write("\n");
  if (falhas) console.log(`⚠️  ${falhas} não puderam ser apagados. Rode o comando de novo.`);
  console.log(`🗑️  Apagados: ${plano.apagarDeals.length} negócios, ${plano.apagarPessoas.length} pessoas, ${plano.apagarOrgs.length} organizações.`);
  console.log("===================================================");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error("\n💥", e.message);
    process.exit(1);
  });
}
