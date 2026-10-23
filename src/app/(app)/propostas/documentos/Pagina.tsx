import type { ReactNode } from "react";

/** Cores dos documentos (mesma identidade do CRM: teal → azul). */
export const COR_PRIMARIA = "#12b6c1";
export const COR_FORTE = "#1b7cb2";
export const COR_TEXTO = "#1a1a1a";
export const COR_SUAVE = "#666666";

/** Uma folha A4. As quebras de página na impressão vêm do CSS `.doc-pagina` (globals.css). */
export function Pagina({ titulo, numero, total, children }: { titulo?: string; numero: number; total: number; children: ReactNode }) {
  return (
    <section className="doc-pagina">
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${COR_PRIMARIA}`, paddingBottom: "4mm", marginBottom: "6mm" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Ydea" style={{ height: "14mm", width: "auto" }} />
        {titulo && <span style={{ fontSize: "10pt", color: COR_SUAVE, letterSpacing: "0.04em", textTransform: "uppercase" }}>{titulo}</span>}
      </header>
      <div>{children}</div>
      <footer style={{ position: "absolute", left: "16mm", right: "16mm", bottom: "8mm", display: "flex", justifyContent: "space-between", fontSize: "8.5pt", color: COR_SUAVE }}>
        <span>Ydea Engenharia e Energias Renováveis</span>
        <span>
          Página {numero} de {total}
        </span>
      </footer>
    </section>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 style={{ fontSize: "14pt", fontWeight: 700, color: COR_FORTE, margin: "0 0 3mm" }}>{children}</h2>;
}

export function Linha({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "6mm", padding: "1.6mm 0", borderBottom: "0.3mm solid #e8e8e8", fontSize: "10.5pt" }}>
      <span style={{ color: COR_SUAVE }}>{rotulo}</span>
      <b style={{ textAlign: "right" }}>{valor}</b>
    </div>
  );
}

export function Tabela({ colunas, linhas, alinhar }: { colunas: string[]; linhas: ReactNode[][]; alinhar?: ("left" | "right" | "center")[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt" }}>
      <thead>
        <tr>
          {colunas.map((c, i) => (
            <th key={c} style={{ background: COR_FORTE, color: "#fff", padding: "1.6mm 2mm", textAlign: alinhar?.[i] ?? "left", fontWeight: 600 }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((l, r) => (
          <tr key={r} style={{ background: r % 2 ? "#f7f7f5" : "#fff" }}>
            {l.map((c, i) => (
              <td key={i} style={{ padding: "1.3mm 2mm", textAlign: alinhar?.[i] ?? "left", borderBottom: "0.2mm solid #ececec" }}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
