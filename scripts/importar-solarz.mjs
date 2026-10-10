// Importa os NEGÓCIOS (cards) do SolarZ CRM para o funil do CRM da YDEA.
//
// Por padrão roda em MODO DE TESTE: lê tudo do SolarZ e mostra o que seria importado,
// mas NÃO grava nada. Só grava com --executar.
//
// Uso (PowerShell, na pasta do projeto) — uma linha por vez:
//   $env:SOLARZ_TOKEN = "cole-aqui-o-token-de-SOMENTE-LEITURA"
//   node scripts/importar-solarz.mjs                       (teste, não grava)
//   node scripts/importar-solarz.mjs --limite 5 --executar (importa só 5, para conferir)
//   node scripts/importar-solarz.mjs --executar            (importa tudo)
//   node scripts/importar-solarz.mjs --desfazer --confirmo (apaga o que veio da SolarZ)
//
// Opções:
//   --funil NOME      só os negócios de um funil. Aceita o nosso id (ex.: pos_acompanhamento,
//                     comercial, engenharia, pos_nps) ou parte do nome do funil na SolarZ.
//                     Lê todos os negócios e filtra aqui (a API não filtra por funil).
//   --so-abertos      só negócios em aberto (padrão: todos, mantendo ganho/perdido)
//   --limite N        processa só os N primeiros negócios
//   --sem-firebase    (só no teste) não lê o Firestore — serve para testar só a API da SolarZ
//
// O token fica só na variável de ambiente da sessão do terminal — nunca em arquivo.
// O programa grava direto no Firestore (chave de administrador), por isso NÃO dispara a
// cadeia de funis nem os avisos por e-mail/sino. Cada registro importado leva origem "solarz".

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const valor = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

const EXECUTAR = flag("--executar");
const DESFAZER = flag("--desfazer");
const SO_ABERTOS = flag("--so-abertos");
const SEM_FIREBASE = flag("--sem-firebase") && !EXECUTAR && !DESFAZER;
const LIMITE = valor("--limite") ? Number(valor("--limite")) : Infinity;
const FUNIL_ALVO = valor("--funil");

const BASE = (process.env.SOLARZ_BASE_URL || "https://api.crm.solarz.com.br/api").replace(/\/$/, "");
const TOKEN = process.env.SOLARZ_TOKEN;
const PAGINA = 100;
// A SolarZ limita a velocidade das consultas: pausa entre páginas (ajustável) e espera quando ela pede.
const PAUSA_MS = Number(process.env.SOLARZ_PAUSA_MS || 1000);
const TENTATIVAS = 7;

// ---------- utilitários ----------
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = (v) => (v === null || v === undefined ? "" : String(v).trim());
const primeiro = (...vs) => vs.map(txt).find((t) => t) || "";
const digitos = (v) => txt(v).replace(/\D/g, "");
const norm = (s) =>
  txt(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function maskTelefone(v) {
  const d = digitos(v).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (!d) return "";
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return d;
}
const maskCPF = (v) => digitos(v).slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
const maskCNPJ = (v) => digitos(v).slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
const maskCEP = (v) => digitos(v).slice(0, 8).replace(/(\d{5})(\d{3})/, "$1-$2");

/** "2026-10-06T17:59:27Z" -> "2026-10-06" no fuso de Brasília. */
function diaBR(iso) {
  if (!iso) return "";
  // Data sem hora (ex.: nascimento "1990-05-20") não pode mudar de dia por causa do fuso.
  if (/^\d{4}-\d{2}-\d{2}$/.test(txt(iso))) return txt(iso);
  const d = new Date(iso);
  if (isNaN(d)) return txt(iso).slice(0, 10);
  return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

function tira(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""));
}

// ---------- chamadas à API da SolarZ ----------
async function solarz(caminho, params = {}) {
  const url = new URL(BASE + caminho);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    let res;
    try {
      res = await fetch(url, { headers: { authorization: TOKEN, accept: "application/json" } });
    } catch (e) {
      if (tentativa === TENTATIVAS) throw new Error(`Sem conexão com ${url.origin}${url.pathname}: ${e.message}`);
      await dormir(1000 * tentativa);
      continue;
    }
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && tentativa < TENTATIVAS) {
      // 429 = "muitas consultas". Respeita o tempo que a SolarZ pedir; senão espera mais a cada tentativa.
      const pedido = Number(res.headers.get("retry-after"));
      const espera = pedido > 0 ? pedido * 1000 : Math.min(2000 * 2 ** (tentativa - 1), 60000);
      process.stdout.write(`\n   ⏳ A SolarZ pediu para ir mais devagar (HTTP ${res.status}). Aguardando ${Math.round(espera / 1000)}s...\n`);
      await dormir(espera);
      continue;
    }
    const corpo = (await res.text()).slice(0, 200);
    const erro = new Error(`HTTP ${res.status} em ${url.pathname} ${corpo}`);
    erro.status = res.status;
    throw erro;
  }
}

/** Lê página por página. `parar(itens)` permite encerrar cedo quando já temos o que precisamos. */
async function todasAsPaginas(caminho, { tamanho = PAGINA, parar } = {}) {
  const itens = [];
  for (let page = 0; ; page++) {
    const r = await solarz(caminho, { page, size: tamanho });
    const lote = Array.isArray(r) ? r : r.content ?? [];
    itens.push(...lote);
    process.stdout.write(`\r   ${caminho}: ${itens.length} lidos`);
    if (parar && parar(itens)) break;
    if (Array.isArray(r) || r.last || lote.length === 0) break;
    await dormir(PAUSA_MS);
  }
  process.stdout.write("\n");
  return itens;
}

// ---------- mapeamento de funis e etapas (nossos) ----------
const FUNIS = {
  comercial: {
    nome: "Comercial",
    prefixo: "",
    etapas: {
      novo_cliente: "Novo cliente",
      primeiro_contato: "Primeiro contato",
      elaboracao_proposta: "Elaboração de proposta",
      proposta_enviada: "Proposta enviada",
      visita: "Visita",
      negociacao: "Negociação",
      aguardando_financiamento: "Aguardando financiamento",
      contrato: "Contrato",
    },
  },
  engenharia: {
    nome: "Engenharia",
    prefixo: "ENGENHARIA",
    etapas: {
      onboard: "Onboard",
      visita_tecnica: "Visita técnica",
      projeto: "Projeto",
      projeto_analise: "Projeto em análise",
      instalacao_comissionamento: "Instalação/Comissionamento",
      vistoria: "Vistoria",
      ligacao: "Ligação",
    },
  },
  pos_acompanhamento: {
    nome: "Pós - Acompanhamento",
    prefixo: "PÓS",
    etapas: {
      on_board: "On board",
      instalacao: "Instalação",
      substituicao_medidor: "Substituição do medidor",
      mes_1: "1º mês",
      mes_2: "2º mês",
      mes_3: "3º mês",
      mes_4_5: "4º e 5º mês",
      negociacao_comercial: "Negociação Comercial",
    },
  },
  pos_nps: {
    nome: "Pós - NPS",
    prefixo: "PÓS NPS",
    etapas: { nps_comercial: "NPS Comercial", nps_instalacao: "NPS Instalação", nps_pos_venda: "NPS Pós-venda" },
  },
  pos_gestao_energetica: {
    nome: "Pós - Gestão Energética",
    prefixo: "",
    etapas: {
      ponto_contato_1: "1º Ponto de contato",
      ponto_contato_2: "2º Ponto de contato",
      ponto_contato_3: "3º Ponto de contato",
      ponto_contato_4: "4º Ponto de contato",
    },
  },
  pos_ampliacao: {
    nome: "Pós - Ampliação e serviços adicionais",
    prefixo: "",
    etapas: { necessidade_interesse: "Necessidade de interesse", elaboracao_proposta: "Elaboração de proposta" },
  },
};

// Ajustes manuais opcionais: scripts/solarz-mapa.json
//   { "funis":  { "NOME OU ID DO FUNIL NA SOLARZ": "engenharia" },
//     "etapas": { "NOME OU ID DA ETAPA NA SOLARZ": "projeto" } }
function lerMapaManual() {
  const caminho = join(__dirname, "solarz-mapa.json");
  if (!existsSync(caminho)) return { funis: {}, etapas: {} };
  const m = JSON.parse(readFileSync(caminho, "utf-8"));
  const n = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [norm(k), v]));
  return { funis: n(m.funis), etapas: n(m.etapas) };
}

function funilPorNome(nomeSolarz, manual) {
  const chave = norm(nomeSolarz);
  if (manual.funis[chave]) return manual.funis[chave];
  return Object.keys(FUNIS).find((id) => norm(FUNIS[id].nome) === chave || norm(id) === chave) || null;
}

function etapaPorNome(funilId, nomeEtapa, idEtapa, manual) {
  const alvo = FUNIS[funilId].etapas;
  const manualHit = manual.etapas[norm(nomeEtapa)] ?? manual.etapas[norm(idEtapa)];
  if (manualHit && alvo[manualHit]) return manualHit;
  const chave = norm(nomeEtapa);
  return Object.keys(alvo).find((id) => norm(alvo[id]) === chave) || null;
}

// ---------- extração tolerante de pessoas / organizações ----------
function enderecoDe(a) {
  if (!a || typeof a !== "object") return {};
  return tira({
    endereco: primeiro(a.street, a.streetName, a.address, a.logradouro, a.line1),
    numero: primeiro(a.number, a.numero),
    bairro: primeiro(a.neighborhood, a.district, a.bairro),
    cidade: primeiro(a.city?.name, typeof a.city === "string" ? a.city : ""),
    estado: primeiro(a.province?.uf, a.state?.uf, a.uf, a.province?.name, typeof a.state === "string" ? a.state : ""),
    cep: maskCEP(primeiro(a.zipCode, a.postalCode, a.zip, a.cep)),
  });
}

function contatoDe(p) {
  const emails = Array.isArray(p.emails) ? p.emails.map((e) => e?.email ?? e?.value ?? e) : [];
  const fones = Array.isArray(p.phones) ? p.phones.map((e) => e?.number ?? e?.phone ?? e?.value ?? e) : [];
  return {
    email: primeiro(p.email, ...emails).toLowerCase(),
    telefone: maskTelefone(primeiro(p.phone, p.cellphone, p.mobile, p.telephone, ...fones)),
  };
}

function pessoaDe(p, nomeUsuario) {
  // Na SolarZ o CPF/CNPJ vem no campo "identifier".
  const doc = digitos(primeiro(p.identifier, p.cpf, p.cpfCnpj, p.document, p.taxId));
  const { email, telefone } = contatoDe(p);
  return tira({
    nome: primeiro(p.name, p.fullName),
    cpf: doc.length === 11 ? maskCPF(doc) : "",
    dataNascimento: diaBR(p.birthDate) || undefined,
    cargo: primeiro(p.jobPosition),
    canalOrigem: primeiro(p.referralSource?.name, typeof p.referralSource === "string" ? p.referralSource : ""),
    email,
    telefone,
    whatsapp: telefone,
    ...enderecoDe(p.address),
    responsavel: nomeUsuario,
    observacoes: "Importado do SolarZ",
    origem: "solarz",
    solarzId: String(p.id),
  });
}

function organizacaoDe(o, nomeUsuario) {
  const doc = digitos(primeiro(o.identifier, o.cnpj, o.cpfCnpj, o.document, o.cpf));
  const { email, telefone } = contatoDe(o);
  return tira({
    nome: primeiro(o.name, o.tradeName, o.legalName),
    tipo: doc.length === 11 ? "PF" : "PJ",
    cnpj: doc.length === 14 ? maskCNPJ(doc) : "",
    cpf: doc.length === 11 ? maskCPF(doc) : "",
    razaoSocial: primeiro(o.legalName),
    nomeFantasia: primeiro(o.tradeName),
    email,
    telefone,
    whatsapp: telefone,
    ...enderecoDe(o.address),
    responsavel: nomeUsuario,
    tags: ["solarz"],
    origem: "solarz",
    solarzId: String(o.id),
  });
}

// ---------- campos personalizados do negócio ----------
const num = (v) => {
  const t = txt(v).replace(/[^\d,.-]/g, "");
  if (!t) return undefined;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) ? n : undefined;
};
const simNao = (v) => {
  const t = norm(v);
  if (!t) return undefined;
  return ["sim", "true", "1", "yes"].includes(t);
};
const PERFIS = { residencial: "residencial", comercial: "comercial", rural: "rural", industrial: "industrial", condominio: "condominio" };
const PRIORIDADES = { baixa: "baixa", media: "media", alta: "alta" };

function camposDe(valores) {
  const por = Object.fromEntries((valores ?? []).map((c) => [norm(c.label), c.value]));
  const v = (rotulo) => por[norm(rotulo)];
  const concessionaria = primeiro(v("Concessionária"));
  return tira({
    perfilCliente: PERFIS[norm(v("Perfil do cliente"))],
    prioridade: PRIORIDADES[norm(v("Prioridade de instalação"))],
    tipoTelhado: primeiro(v("Tipo de telhado")),
    concessionaria,
    distribuidora: concessionaria,
    fase: primeiro(v("Fase da rede")),
    consumoMedio: num(v("Consumo médio de energia (kWh)")),
    potenciaSistema: num(v("Potência do sistema (kWp)")),
    tensao: primeiro(v("Tensão da rede")),
    validadeProposta: primeiro(v("Validade da proposta")),
    drone: simNao(v("Drone")),
    contaContrato: primeiro(v("Conta Contrato")),
    cargaInstalada: num(v("Carga instalada")),
    trocaTitularidade: simNao(v("Troca de titularidade")),
    valorProjeto: num(v("Valor do Projeto")),
    npsVenda: num(v("NPS Venda")),
    npsInstalacao: num(v("NPS Instalação")),
    npsPosVenda: num(v("NPS Pós-venda")),
  });
}

// ---------- Firebase ----------
async function iniciarFirebase() {
  const caminho = join(__dirname, "..", "service-account.json");
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
  const env = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  let chave;
  if (env) chave = JSON.parse(env.startsWith("{") ? env : Buffer.from(env, "base64").toString("utf-8"));
  else if (existsSync(caminho)) chave = JSON.parse(readFileSync(caminho, "utf-8"));
  else {
    console.error("\n❌ Não encontrei o service-account.json na raiz do projeto.\n");
    process.exit(1);
  }
  initializeApp({ credential: cert(chave) });
  return { db: getFirestore(), Timestamp };
}

async function desfazer() {
  if (!flag("--confirmo")) {
    console.error("\nIsto APAGA todos os cards, pessoas e organizações importados da SolarZ,\n" +
      "inclusive anotações, atividades e documentos que alguém tenha adicionado a eles depois.\n" +
      "Se tem certeza, rode de novo com: --desfazer --confirmo\n");
    process.exit(1);
  }
  const { db } = await iniciarFirebase();
  for (const colecao of ["deals", "pessoas", "organizacoes"]) {
    const snap = await db.collection(colecao).where("origem", "==", "solarz").get();
    for (const d of snap.docs) await db.recursiveDelete(d.ref);
    console.log(`🗑️  ${colecao}: ${snap.size} apagados`);
  }
  console.log("\nPronto. Nada de origem SolarZ resta no CRM.");
}

// ---------- principal ----------
async function main() {
  if (DESFAZER) return desfazer();

  if (!TOKEN) {
    console.error('\n❌ Falta o token. No PowerShell, rode antes:\n   $env:SOLARZ_TOKEN = "cole-o-token-de-somente-leitura"\n');
    process.exit(1);
  }
  console.log(EXECUTAR ? "▶️  MODO REAL: vai gravar no CRM.\n" : "🧪 MODO DE TESTE: nada será gravado.\n");

  // 1) negócios
  console.log("📥 Lendo da SolarZ...");
  const aberto = (n) => txt(n.status).toUpperCase() === "OPEN";
  const limitado = LIMITE !== Infinity;
  const manual = lerMapaManual();
  const funisSolarz = new Map();
  const carregarFunis = async (lista) => {
    for (const id of new Set(lista.map((n) => n.pipelineId).filter(Boolean))) {
      if (funisSolarz.has(id)) continue;
      try {
        funisSolarz.set(id, await solarz(`/v2/open-api/pipeline/${id}`));
        await dormir(300);
      } catch (e) {
        console.warn(`⚠️  Não consegui ler o funil ${id}: ${e.message}`);
      }
    }
  };

  let negocios;
  let total;
  if (FUNIL_ALVO) {
    // A API não filtra por funil: lê todos os negócios e escolhe aqui os do funil pedido.
    negocios = await todasAsPaginas("/v2/open-api/deal");
    total = negocios.length;
    await carregarFunis(negocios);
    const alvo = norm(FUNIL_ALVO);
    negocios = negocios.filter((n) => {
      const nome = primeiro(funisSolarz.get(n.pipelineId)?.name);
      return funilPorNome(nome, manual) === FUNIL_ALVO || (alvo && norm(nome).includes(alvo));
    });
    console.log(`   ${negocios.length} negócios do funil "${FUNIL_ALVO}" (de ${total} lidos)`);
  } else {
    negocios = await todasAsPaginas("/v2/open-api/deal", {
      // Com --limite, pede só o necessário e para assim que juntar a quantidade pedida.
      tamanho: limitado && !SO_ABERTOS ? Math.min(PAGINA, LIMITE) : PAGINA,
      parar: limitado ? (itens) => (SO_ABERTOS ? itens.filter(aberto).length : itens.length) >= LIMITE : undefined,
    });
    total = negocios.length;
  }
  if (SO_ABERTOS) negocios = negocios.filter(aberto);
  negocios = negocios.slice(0, LIMITE);

  // 2) apoio: funis, pessoas, organizações, usuários
  await carregarFunis(negocios);
  // Lê as listas de pessoas/organizações só até achar quem os negócios usam (evita ler tudo à toa).
  const precisa = (campo) => new Set(negocios.map((n) => n[campo]).filter(Boolean));
  const tentar = async (caminho, ids) => {
    if (ids && ids.size === 0) return [];
    try {
      return await todasAsPaginas(caminho, {
        parar: ids ? (itens) => [...ids].every((id) => itens.some((x) => x.id === id)) : undefined,
      });
    } catch (e) {
      console.warn(`\n⚠️  ${e.message}`);
      return [];
    }
  };
  const pessoas = new Map((await tentar("/v2/open-api/client/persons", precisa("personId"))).map((p) => [p.id, p]));
  const orgs = new Map((await tentar("/v2/open-api/client/organizations", precisa("organizationId"))).map((o) => [o.id, o]));
  const usuariosSolarz = new Map((await tentar("/v2/open-api/users")).map((u) => [u.id, u]));

  // nossos usuários (para casar o responsável pelo e-mail)
  let fb = null;
  const nossosPorEmail = new Map();
  if (!SEM_FIREBASE) {
    fb = await iniciarFirebase();
    const snap = await fb.db.collection("usuarios").get();
    snap.docs.forEach((d) => nossosPorEmail.set(txt(d.data().email).toLowerCase(), d.data().nome));
  }
  const responsavelDe = (ownerId) => {
    const u = usuariosSolarz.get(ownerId);
    if (!u) return "";
    return nossosPorEmail.get(txt(u.email).toLowerCase()) || primeiro(u.name, u.fullName);
  };

  // 3) monta os registros
  const stats = {
    lidos: total, considerados: negocios.length, prontos: 0, semFunil: 0, etapaPadrao: 0,
    statusDesconhecido: 0, semPessoa: 0, jaExistiam: 0, gravados: 0, erros: 0,
  };
  const funisSemMapa = new Map();
  const etapasSemMapa = new Map();
  const statusVistos = new Map();
  const registros = [];
  const porFunil = new Map(); // nosso funil -> { total, aberto, ganho, perdido }
  const pessoasUsadas = new Set();
  const orgsUsadas = new Set();

  for (const n of negocios) {
    const funilSz = funisSolarz.get(n.pipelineId);
    const nomeFunil = primeiro(funilSz?.name, funilSz?.title);
    const funilId = funilPorNome(nomeFunil, manual);
    if (!funilId) {
      stats.semFunil++;
      const k = `${n.pipelineId} "${nomeFunil || "nome não lido"}"`;
      funisSemMapa.set(k, (funisSemMapa.get(k) || 0) + 1);
      continue;
    }
    const etapasSz = funilSz?.stages ?? funilSz?.pipelineStages ?? [];
    const etapaSz = etapasSz.find((e) => e.id === n.pipelineStageId);
    const nomeEtapa = primeiro(etapaSz?.name, etapaSz?.title);
    let etapaId = etapaPorNome(funilId, nomeEtapa, n.pipelineStageId, manual);
    if (!etapaId) {
      stats.etapaPadrao++;
      const k = `${FUNIS[funilId].nome} / ${n.pipelineStageId} "${nomeEtapa || "nome não lido"}"`;
      etapasSemMapa.set(k, (etapasSemMapa.get(k) || 0) + 1);
      etapaId = Object.keys(FUNIS[funilId].etapas)[0];
    }

    const st = txt(n.status).toUpperCase();
    statusVistos.set(st || "(vazio)", (statusVistos.get(st || "(vazio)") || 0) + 1);
    const status = st === "WON" ? "ganho" : st === "LOST" || st === "LOSS" ? "perdido" : "aberto";
    if (!["OPEN", "WON", "LOST", "LOSS"].includes(st)) stats.statusDesconhecido++;

    const pessoa = n.personId ? pessoas.get(n.personId) : null;
    const org = n.organizationId ? orgs.get(n.organizationId) : null;
    if (!pessoa && !org) stats.semPessoa++;
    if (pessoa) pessoasUsadas.add(pessoa.id);
    if (org) orgsUsadas.add(org.id);

    const nomeCliente = primeiro(pessoa?.name, org?.name) || txt(n.name).replace(/^neg[oó]cio\s+/i, "");
    const prefixo = FUNIS[funilId].prefixo;
    const titulo = prefixo ? `[${prefixo}] ${nomeCliente}` : nomeCliente;
    const quando = n.wonAt || n.lossAt || null;
    const motivo = n.dealReasonForLoss;

    registros.push({
      id: `solarz-${n.id}`,
      dados: tira({
        funnelId: funilId,
        stageId: etapaId,
        titulo,
        valor: Number(n.value) || 0,
        responsavel: responsavelDe(n.ownerId) || "Sem responsável",
        organizacaoId: org ? `solarz-org-${org.id}` : undefined,
        pessoaId: pessoa ? `solarz-pessoa-${pessoa.id}` : undefined,
        previsaoFechamento: n.expectedCloseDate,
        canalOrigem: primeiro(n.referralSource?.name, n.referralSource),
        status,
        motivoPerda: status === "perdido" ? primeiro(motivo?.name, motivo?.description, motivo) : undefined,
        fechadoEm: quando ? new Date(quando).toISOString() : undefined,
        ...camposDe(n.dealCustomFieldValues),
        createdAt: diaBR(n.createdAt),
        // Não sabemos o histórico de etapas da SolarZ: a última mudança é a melhor aproximação.
        historicoEtapas: [{ stageId: etapaId, em: new Date(n.updatedAt || n.createdAt).toISOString() }],
        origem: "solarz",
        solarzId: String(n.id),
        solarzFunil: nomeFunil,
        solarzEtapa: nomeEtapa,
      }),
      criadoEm: n.createdAt,
    });
    stats.prontos++;
    const c = porFunil.get(funilId) ?? { total: 0, aberto: 0, ganho: 0, perdido: 0 };
    c.total++;
    c[status]++;
    porFunil.set(funilId, c);
  }

  // 4) gravação
  if (EXECUTAR) {
    const { db, Timestamp } = fb;
    const gravarNovo = async (colecao, id, dados, criadoEm) => {
      const ref = db.collection(colecao).doc(id);
      try {
        await ref.create({ ...dados, ...(criadoEm ? { _createdAt: Timestamp.fromDate(new Date(criadoEm)) } : {}) });
        return "novo";
      } catch (e) {
        if (e.code === 6 || /already exists/i.test(e.message)) return "existia";
        throw e;
      }
    };
    const mapaResp = (id) => responsavelDe(id);
    for (const id of pessoasUsadas) {
      const p = pessoas.get(id);
      await gravarNovo("pessoas", `solarz-pessoa-${id}`, pessoaDe(p, mapaResp(p.ownerId)));
    }
    for (const id of orgsUsadas) {
      const o = orgs.get(id);
      await gravarNovo("organizacoes", `solarz-org-${id}`, organizacaoDe(o, mapaResp(o.ownerId)));
    }
    let feitos = 0;
    for (const r of registros) {
      try {
        const res = await gravarNovo("deals", r.id, r.dados, r.criadoEm);
        if (res === "novo") stats.gravados++;
        else stats.jaExistiam++;
      } catch (e) {
        stats.erros++;
        console.error(`\n❌ ${r.id}: ${e.message}`);
      }
      if (++feitos % 25 === 0) process.stdout.write(`\r   gravando... ${feitos}/${registros.length}`);
    }
    process.stdout.write("\n");
  }

  // 5) relatório (sem nenhum dado pessoal)
  const linhas = (m) => [...m].map(([k, q]) => `     - ${k}: ${q} negócio(s)`).join("\n");
  console.log("\n==================== RELATÓRIO ====================");
  console.log(`Negócios lidos da SolarZ: ${stats.lidos}${FUNIL_ALVO ? ` (filtro: funil "${FUNIL_ALVO}")` : ""}${SO_ABERTOS ? " (filtro: só abertos)" : ""}${LIMITE < Infinity ? ` (limite ${LIMITE})` : ""}`);
  if (FUNIL_ALVO && stats.prontos === 0) {
    const nomes = [...funisSolarz.values()].map((f) => `"${f.name}"`).join(", ");
    console.log(`⚠️  Nenhum negócio encontrado para o funil "${FUNIL_ALVO}". Funis encontrados na SolarZ: ${nomes || "(nenhum lido)"}`);
  }
  console.log(`Prontos para importar: ${stats.prontos}`);
  if (porFunil.size) {
    console.log("Por funil (no CRM):");
    for (const [id, c] of porFunil) {
      console.log(`   - ${FUNIS[id].nome}: ${c.total} (abertos ${c.aberto}, ganhos ${c.ganho}, perdidos ${c.perdido})`);
    }
  }
  console.log(`Status encontrados: ${[...statusVistos].map(([k, q]) => `${k}=${q}`).join(", ")}`);
  console.log(`Pessoas ligadas: ${pessoasUsadas.size} | Organizações ligadas: ${orgsUsadas.size} | Negócios sem pessoa/organização: ${stats.semPessoa}`);
  if (EXECUTAR) console.log(`GRAVADOS: ${stats.gravados} | Já existiam (pulados): ${stats.jaExistiam} | Erros: ${stats.erros}`);
  if (stats.semFunil) console.log(`\n⚠️  Pulados por funil sem correspondência (${stats.semFunil}):\n${linhas(funisSemMapa)}`);
  if (stats.etapaPadrao) console.log(`\n⚠️  Em etapa sem correspondência — foram para a 1ª etapa do funil (${stats.etapaPadrao}):\n${linhas(etapasSemMapa)}`);
  if (stats.semFunil || stats.etapaPadrao) {
    console.log('\n   Para resolver, crie scripts/solarz-mapa.json, por exemplo:\n   { "funis": { "Nome do funil na SolarZ": "engenharia" }, "etapas": { "Nome da etapa na SolarZ": "projeto" } }');
  }
  // estrutura (só NOMES de campos, sem valores) — pode ser colada para ajuste do mapeamento
  const chaves = (x) => (x ? Object.keys(x).join(", ") : "(nenhum lido)");
  console.log("\nCampos da pessoa na SolarZ (só nomes): " + chaves([...pessoas.values()][0]));
  console.log("Campos da organização (só nomes): " + chaves([...orgs.values()][0]));
  console.log("Campos do usuário (só nomes): " + chaves([...usuariosSolarz.values()][0]));
  console.log("Campos do funil (só nomes): " + chaves([...funisSolarz.values()][0]));
  const et0 = ([...funisSolarz.values()][0]?.stages ?? [])[0];
  console.log("Campos da etapa (só nomes): " + chaves(et0));
  console.log(EXECUTAR ? "" : "\nNada foi gravado (modo de teste). Para gravar: --executar");
  console.log("===================================================");
}

main().catch((e) => {
  console.error("\n💥", e.message);
  process.exit(1);
});
