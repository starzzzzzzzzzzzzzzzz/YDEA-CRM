import { auth } from "@/lib/firebase/config";
import type { TarifasAneel } from "./aneel";

export type RespostaTarifas = { ok: true; tarifas: TarifasAneel } | { ok: false; erro: string };

/** Pede ao servidor as tarifas vigentes da concessionária (ANEEL). */
export async function buscarTarifasAneel(concessionaria: string, subgrupo: string): Promise<RespostaTarifas> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return { ok: false, erro: "Sessão expirada. Entre novamente." };
    const qs = new URLSearchParams({ concessionaria, subgrupo });
    const r = await fetch(`/api/tarifas?${qs}`, { headers: { Authorization: `Bearer ${idToken}` } });
    const d = await r.json();
    if (!r.ok) return { ok: false, erro: d.error ?? "Não foi possível buscar as tarifas." };
    return { ok: true, tarifas: d.tarifas as TarifasAneel };
  } catch {
    return { ok: false, erro: "Não foi possível buscar as tarifas." };
  }
}
