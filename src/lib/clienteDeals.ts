import { Cliente, Deal, DealStatus, Organizacao, Pessoa } from "./types";

function norm(s?: string | null) {
  return (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function dig(s?: string | null) {
  return (s ?? "").replace(/\D/g, "");
}

/** Negócios que pertencem a um cliente (casa por CPF/CNPJ ou, na falta, pelo nome). */
export function dealsDoCliente(
  cliente: Cliente,
  deals: Deal[],
  getOrganizacao: (id?: string) => Organizacao | undefined,
  getPessoa: (id?: string) => Pessoa | undefined
): Deal[] {
  const nome = norm(cliente.nome);
  const doc = dig(cliente.cpf) || dig(cliente.cnpj);
  return deals.filter((d) => {
    const org = getOrganizacao(d.organizacaoId);
    const pes = getPessoa(d.pessoaId);
    const docs = [org?.cpf, org?.cnpj, pes?.cpf].map(dig).filter((x) => x.length >= 11);
    if (doc.length >= 11 && docs.includes(doc)) return true;
    const nomes = [org?.nome, pes?.nome].map(norm).filter(Boolean);
    return !!nome && nomes.includes(nome);
  });
}

/**
 * Situação do cliente a partir dos negócios: ganho > em andamento > perdido.
 * undefined = sem negócio (cai no status normal do cadastro).
 */
export function situacaoDoCliente(negocios: Deal[]): DealStatus | undefined {
  if (negocios.length === 0) return undefined;
  const st = negocios.map((d) => d.status ?? "aberto");
  if (st.includes("ganho")) return "ganho";
  if (st.includes("aberto")) return "aberto";
  return "perdido";
}

export const SITUACAO_LABEL: Record<DealStatus, string> = {
  aberto: "Em andamento",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const SITUACAO_STYLE: Record<DealStatus, string> = {
  aberto: "bg-badge-blue-bg text-badge-blue-text",
  ganho: "bg-badge-green-bg text-badge-green-text",
  perdido: "bg-badge-red-bg text-badge-red-text",
};
