/**
 * Textos e datas dos documentos: placeholders sanitizados, validade padrão,
 * valor por extenso e formatação pt-BR. Funções puras (sem React/Firebase).
 */
import { VALIDADE_PADRAO_DIAS } from "./proposal-calculations";

// --- Datas (strings ISO YYYY-MM-DD; sem `new Date("YYYY-MM-DD")`, que desloca o dia por fuso) ---

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Hoje no calendário LOCAL do usuário, em ISO (toISOString usaria UTC e viraria o dia à noite). */
export function hojeISO(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}

export function adicionarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Validade inicial da proposta: hoje + 7 dias (para não nascer vencida). */
export function validadePadrao(agora: Date = new Date()): string {
  return adicionarDias(hojeISO(agora), VALIDADE_PADRAO_DIAS);
}

export function formatarDataBR(iso?: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "-";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

// --- Placeholders ---

export function valorOuTraco(v: unknown): string {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s === "" ? "-" : s;
}

/**
 * Troca {{chave}} (aceita caminhos como {{cliente.nome}}) pelo valor.
 * Campo opcional vazio vira "-" — nunca deixa a tag crua no documento impresso.
 */
export function preencherPlaceholders(texto: string, dados: Record<string, unknown>): string {
  return texto.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, chave: string) => {
    const valor = chave.split(".").reduce<unknown>((acc, k) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
      return undefined;
    }, dados);
    return valorOuTraco(valor);
  });
}

/** Detecta texto que ainda tem marcador de preenchimento (ex.: "R$ 00000 (VALOR POR ESCRITO)"). */
export function temPlaceholderPendente(texto: string): boolean {
  return /\{\{.*?\}\}|VALOR POR ESCRITO|FORMA DE PAGAMENTO|R\$\s*0{3,}/.test(texto);
}

// --- Formatação ---

export function formatarBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarNumero(v: number, casas = 2): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

// --- Valor por extenso (R$) ---

const UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

/** 1..999 por extenso. */
function grupoPorExtenso(n: number): string {
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto > 0) {
    if (resto < 20) partes.push(UNIDADES[resto]);
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      partes.push(u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
    }
  }
  return partes.join(" e ");
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const grupos: { texto: string; valor: number }[] = [];
  if (milhoes > 0) grupos.push({ texto: `${grupoPorExtenso(milhoes)} ${milhoes === 1 ? "milhão" : "milhões"}`, valor: milhoes * 1_000_000 });
  if (milhares > 0) grupos.push({ texto: milhares === 1 ? "mil" : `${grupoPorExtenso(milhares)} mil`, valor: milhares * 1000 });
  if (resto > 0) grupos.push({ texto: grupoPorExtenso(resto), valor: resto });

  // "e" antes do último grupo quando ele é < 100 ou centena redonda; senão vírgula.
  return grupos.reduce((acc, g, i) => {
    if (i === 0) return g.texto;
    const ultimo = i === grupos.length - 1;
    const usaE = ultimo && (g.valor < 100 || g.valor % 100 === 0);
    return `${acc}${usaE ? " e " : ", "}${g.texto}`;
  }, "");
}

/** 10977.77 → "dez mil, novecentos e setenta e sete reais e setenta e sete centavos". */
export function valorPorExtenso(valor: number): string {
  const totalCentavos = Math.round(Math.abs(valor) * 100);
  const reais = Math.floor(totalCentavos / 100);
  const centavos = totalCentavos % 100;

  const partes: string[] = [];
  if (reais > 0 || centavos === 0) {
    const redondoMilhao = reais >= 1_000_000 && reais % 1_000_000 === 0;
    partes.push(`${inteiroPorExtenso(reais)}${redondoMilhao ? " de" : ""} ${reais === 1 ? "real" : "reais"}`);
  }
  if (centavos > 0) partes.push(`${inteiroPorExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  return partes.join(" e ");
}
