import { Atividade } from "@/lib/types";

/** Atividade + o negócio a que pertence (a atividade vive em deals/{dealId}/atividades). */
export type AtividadeDoNegocio = { dealId: string; atividade: Atividade };

const p2 = (n: number) => String(n).padStart(2, "0");

/** Data de hoje no fuso do navegador, no formato YYYY-MM-DD (o mesmo do campo `data`). */
export function dataLocalISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

function horaLocal(d: Date): string {
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/** Atividades antigas têm horário; as novas podem ser "dia todo" (sem horário). */
export function temHorario(a: Atividade): boolean {
  return !a.diaTodo && !!(a.horaInicio || a.horaFim);
}

/**
 * Atrasada = ainda pendente e:
 * - o dia já passou; ou
 * - é hoje, tem horário e o horário de fim (ou de início, se não houver fim) já passou.
 * Atividade "dia todo" só atrasa quando o dia termina.
 */
export function estaAtrasada(a: Atividade, agora: Date = new Date()): boolean {
  if (a.concluida) return false;
  const hoje = dataLocalISO(agora);
  if (a.data < hoje) return true;
  if (a.data > hoje) return false;
  if (!temHorario(a)) return false;
  const fim = a.horaFim || a.horaInicio;
  return fim < horaLocal(agora);
}

export function ehParaHoje(a: Atividade, agora: Date = new Date()): boolean {
  return !a.concluida && a.data === dataLocalISO(agora);
}

/** "03/10/2026 · Dia todo" ou "03/10/2026 · 09:00–10:00". */
export function quandoTexto(a: Atividade): string {
  const dia = new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR");
  if (!temHorario(a)) return `${dia} · Dia todo`;
  const horas = a.horaInicio && a.horaFim ? `${a.horaInicio}–${a.horaFim}` : a.horaInicio || a.horaFim;
  return `${dia} · ${horas}`;
}

/**
 * A atividade é de quem está logado? O campo `responsavelId` já foi gravado como UID (padrão)
 * e, em atividades antigas atribuídas a outra pessoa, como e-mail — por isso aceita os dois,
 * e cai no nome como último recurso.
 */
export function ehDoUsuario(a: Atividade, u: { id: string; email: string; nome: string }): boolean {
  return a.responsavelId === u.id || a.responsavelId === u.email || a.responsavelNome === u.nome;
}
