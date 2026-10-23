import { calcularProposta } from "@/lib/propostas/proposal-calculations";
import { valorOuTraco } from "@/lib/propostas/proposal-text";
import type { PropostaDados, PropostaSalva, ResultadoProposta } from "@/lib/propostas/types";

/** Tudo o que os três documentos precisam, calculado UMA vez a partir dos dados do wizard. */
export type ContextoDocumento = {
  numero: number | null;
  dados: PropostaDados;
  r: ResultadoProposta;
  criadoEm: Date;
};

export function contextoDocumento(dados: PropostaDados, salva?: Pick<PropostaSalva, "numero" | "criadoEm"> | null): ContextoDocumento {
  const criadoEm = salva?.criadoEm ? new Date(salva.criadoEm) : new Date();
  return { numero: salva?.numero ?? null, dados, r: calcularProposta(dados, criadoEm), criadoEm };
}

export function enderecoUsina(d: PropostaDados): string {
  const rua = [d.usinaRua, d.usinaNumero].map((s) => s.trim()).filter(Boolean).join(", ");
  const cidade = [d.usinaCidade, d.usinaEstado].map((s) => s.trim()).filter(Boolean).join("/");
  const partes = [rua, d.usinaBairro.trim(), cidade, d.usinaCep.trim()].filter(Boolean);
  return partes.length ? partes.join(" - ") : "-";
}

export const t = valorOuTraco;
