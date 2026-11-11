"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  excluirInversorCatalogo,
  excluirModuloCatalogo,
  importarInversoresCatalogo,
  importarModulosCatalogo,
} from "@/lib/firebase/catalogo";
import { importarInversores, importarModulos } from "@/lib/propostas/catalogo-import";
import { formatarBRL, formatarNumero } from "@/lib/propostas/proposal-text";
import { FASE_LABEL } from "@/lib/propostas/types";
import { inputClass } from "@/components/ui/Field";
import { useCatalogo } from "../useCatalogo";

const MODELO_MODULOS = "marca;modelo;potência (W);largura (mm);comprimento (mm);valor (R$);garantia desempenho (anos);garantia fabricação (anos)\nAE SOLAR;AE650ME-132BD;650;1302;2384;;;";
const MODELO_INVERSORES = "marca;modelo;potência (kW);tensão;fase;potência máxima (VA);valor (R$);garantia fabricação (anos)\nWEG;SIW200G M050 W1;5;V220;Monofásico;5500;2798,05;";

const btn = "flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-3.5 py-2 hover:bg-brand-strong transition-colors disabled:opacity-60";

export default function CatalogoPage() {
  const { showToast } = useToast();
  const { modulos, inversores, carregando, erro, recarregar } = useCatalogo();
  const [textoModulos, setTextoModulos] = useState("");
  const [textoInversores, setTextoInversores] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function importar(tipo: "modulos" | "inversores") {
    const r = tipo === "modulos" ? importarModulos(textoModulos) : importarInversores(textoInversores);
    if (r.erros.length) {
      showToast(r.erros.slice(0, 2).join(" "), "error");
      if (r.itens.length === 0) return;
    }
    if (r.itens.length === 0) {
      showToast("Nenhuma linha para importar", "error");
      return;
    }
    setOcupado(true);
    try {
      if (tipo === "modulos") {
        await importarModulosCatalogo(importarModulos(textoModulos).itens);
        setTextoModulos("");
      } else {
        await importarInversoresCatalogo(importarInversores(textoInversores).itens);
        setTextoInversores("");
      }
      await recarregar();
      showToast(`${r.itens.length} equipamento(s) importado(s)${r.erros.length ? ` · ${r.erros.length} linha(s) ignorada(s)` : ""}`);
    } catch (err) {
      console.error("Erro ao importar catálogo:", err);
      showToast("Erro ao importar", "error");
    } finally {
      setOcupado(false);
    }
  }

  /** Os dois equipamentos que apareciam nas telas do sistema anterior (AE650 e WEG 5 kW), como ponto de partida. */
  async function carregarExemplos() {
    setOcupado(true);
    try {
      await importarModulosCatalogo([{ marca: "AE SOLAR", modelo: "AE650ME-132BD", potenciaW: 650, larguraMm: 1302, comprimentoMm: 2384 }]);
      await importarInversoresCatalogo([{ marca: "WEG", modelo: "SIW200G M050 W1", potenciaKw: 5, tensaoSaida: "V220", fase: "monofasico", potenciaMaximaVA: 5500, valorUnitario: 2798.05 }]);
      await recarregar();
      showToast("Equipamentos de exemplo cadastrados");
    } catch {
      showToast("Erro ao cadastrar", "error");
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(tipo: "modulos" | "inversores", id: string) {
    if (!window.confirm("Excluir este equipamento do catálogo?")) return;
    try {
      await (tipo === "modulos" ? excluirModuloCatalogo(id) : excluirInversorCatalogo(id));
      await recarregar();
    } catch {
      showToast("Erro ao excluir", "error");
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div>
        <Link href="/propostas" className="flex items-center gap-1 text-[12.5px] text-text-faint hover:text-text-gray mb-1">
          <ArrowLeft size={13} /> Propostas
        </Link>
        <h1 className="font-display font-semibold text-xl text-text-dark">Catálogo de equipamentos</h1>
        <p className="text-[12.5px] text-text-faint mt-1">
          Cadastre os módulos e inversores uma vez; no gerador, escolher o modelo preenche potência, dimensões, garantias e valor.
          Cole as linhas de uma planilha (Excel/Google Sheets) ou separe por ponto e vírgula.
        </p>
        {erro && <p className="text-[12.5px] text-badge-red-text mt-2">Não foi possível carregar o catálogo.</p>}
        {!carregando && !erro && modulos.length === 0 && inversores.length === 0 && (
          <button className={`${btn} mt-3`} disabled={ocupado} onClick={carregarExemplos}>
            Começar com os 2 equipamentos do sistema anterior
          </button>
        )}
      </div>

      {/* Módulos */}
      <section className="bg-card-bg border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-[15px] text-text-dark">Módulos fotovoltaicos ({modulos.length})</h2>
        {carregando ? (
          <p className="text-sm text-text-faint">Carregando...</p>
        ) : modulos.length === 0 ? (
          <p className="text-sm text-text-faint">Nenhum módulo cadastrado.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-text-faint border-b border-border-soft">
                  <th className="py-2 pr-3 font-medium">Marca</th>
                  <th className="py-2 pr-3 font-medium">Modelo</th>
                  <th className="py-2 pr-3 font-medium text-right">Potência</th>
                  <th className="py-2 pr-3 font-medium text-right">Dimensões (mm)</th>
                  <th className="py-2 pr-3 font-medium text-right">Valor</th>
                  <th className="py-2 pr-3 font-medium text-right">Garantias (anos)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {modulos.map((m) => (
                  <tr key={m.id} className="border-b border-border-soft last:border-0">
                    <td className="py-2 pr-3">{m.marca}</td>
                    <td className="py-2 pr-3">{m.modelo}</td>
                    <td className="py-2 pr-3 text-right">{formatarNumero(m.potenciaW, 0)} W</td>
                    <td className="py-2 pr-3 text-right">{m.larguraMm && m.comprimentoMm ? `${m.larguraMm} × ${m.comprimentoMm}` : "-"}</td>
                    <td className="py-2 pr-3 text-right">{m.valorUnitario ? formatarBRL(m.valorUnitario) : "-"}</td>
                    <td className="py-2 pr-3 text-right">{m.garantiaDesempenhoAnos ?? "-"} / {m.garantiaFabricacaoAnos ?? "-"}</td>
                    <td className="py-2 text-right">
                      <button className="text-text-faint hover:text-badge-red-text" onClick={() => excluir("modulos", m.id)} aria-label="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <textarea rows={4} className={`${inputClass} font-mono text-[12px]`} placeholder={MODELO_MODULOS} value={textoModulos} onChange={(e) => setTextoModulos(e.target.value)} />
        <button className={btn} disabled={ocupado || !textoModulos.trim()} onClick={() => importar("modulos")}>
          <Upload size={14} /> Importar módulos
        </button>
      </section>

      {/* Inversores */}
      <section className="bg-card-bg border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-[15px] text-text-dark">Inversores ({inversores.length})</h2>
        {carregando ? (
          <p className="text-sm text-text-faint">Carregando...</p>
        ) : inversores.length === 0 ? (
          <p className="text-sm text-text-faint">Nenhum inversor cadastrado.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-text-faint border-b border-border-soft">
                  <th className="py-2 pr-3 font-medium">Marca</th>
                  <th className="py-2 pr-3 font-medium">Modelo</th>
                  <th className="py-2 pr-3 font-medium text-right">Potência</th>
                  <th className="py-2 pr-3 font-medium">Tensão / fase</th>
                  <th className="py-2 pr-3 font-medium text-right">Pot. máx.</th>
                  <th className="py-2 pr-3 font-medium text-right">Valor</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {inversores.map((i) => (
                  <tr key={i.id} className="border-b border-border-soft last:border-0">
                    <td className="py-2 pr-3">{i.marca}</td>
                    <td className="py-2 pr-3">{i.modelo}</td>
                    <td className="py-2 pr-3 text-right">{formatarNumero(i.potenciaKw)} kW</td>
                    <td className="py-2 pr-3">{i.tensaoSaida} · {FASE_LABEL[i.fase]}</td>
                    <td className="py-2 pr-3 text-right">{i.potenciaMaximaVA ? `${formatarNumero(i.potenciaMaximaVA, 0)} VA` : "-"}</td>
                    <td className="py-2 pr-3 text-right">{i.valorUnitario ? formatarBRL(i.valorUnitario) : "-"}</td>
                    <td className="py-2 text-right">
                      <button className="text-text-faint hover:text-badge-red-text" onClick={() => excluir("inversores", i.id)} aria-label="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <textarea rows={4} className={`${inputClass} font-mono text-[12px]`} placeholder={MODELO_INVERSORES} value={textoInversores} onChange={(e) => setTextoInversores(e.target.value)} />
        <button className={btn} disabled={ocupado || !textoInversores.trim()} onClick={() => importar("inversores")}>
          <Upload size={14} /> Importar inversores
        </button>
      </section>
    </div>
  );
}
