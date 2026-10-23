import { formatarBRL, formatarDataBR, formatarNumero, preencherPlaceholders, valorOuTraco as t, valorPorExtenso } from "@/lib/propostas/proposal-text";
import { CONTRATADA, FORO_CONTRATO } from "@/lib/propostas/constants";
import { H2, Linha, Pagina, Tabela } from "./Pagina";
import { ContextoDocumento, enderecoUsina } from "./dados-documento";
import { CLAUSULAS_GARANTIAS, CLAUSULAS_OBRIGACOES, SecaoContrato } from "./contrato-clausulas";

const TOTAL = 7;
const p: React.CSSProperties = { fontSize: "10.5pt", lineHeight: 1.6, textAlign: "justify", margin: "0 0 3mm" };

function Secao({ s, vars }: { s: SecaoContrato; vars: Record<string, unknown> }) {
  return (
    <div style={{ marginBottom: "5mm" }}>
      <H2>{s.titulo}</H2>
      {s.itens.map((i) => (
        <p key={i} style={p}>
          {preencherPlaceholders(i, vars)}
        </p>
      ))}
    </div>
  );
}

export default function DocumentoContrato({ ctx }: { ctx: ContextoDocumento }) {
  const { dados: d, r } = ctx;
  const hoje = ctx.criadoEm;
  const vars = {
    numero_proposta: ctx.numero,
    concessionaria: d.concessionaria,
    endereco_usina: enderecoUsina(d),
  };

  return (
    <>
      {/* 1 — Partes */}
      <Pagina titulo="Contrato comercial" numero={1} total={TOTAL}>
        <h1 style={{ fontSize: "16pt", fontWeight: 700, textAlign: "center", margin: "4mm 0 8mm" }}>
          CONTRATO DE FORNECIMENTO E INSTALAÇÃO DE SISTEMA FOTOVOLTAICO
        </h1>
        <H2>CONTRATANTE</H2>
        <p style={p}>
          <b>{t(d.clienteNome)}</b>, {t(d.nacionalidade)}, profissão: {t(d.clienteProfissao)}, inscrito(a) no CPF/CNPJ nº {t(d.clienteCpfCnpj)}, residente e domiciliado(a) em {t(d.clienteEndereco)}.
        </p>
        <H2>CONTRATADA</H2>
        <p style={p}>
          <b>{t(CONTRATADA.razaoSocial)}</b>, CNPJ nº {t(CONTRATADA.cnpj)}, com sede em {t(d.enderecoBase)}, representada por {t(CONTRATADA.representante)}.
        </p>
        <p style={p}>
          As partes acima identificadas, de comum acordo, firmam o presente contrato, referente à proposta comercial nº {t(ctx.numero)}, mediante as cláusulas a seguir.
        </p>
        {d.infoContrato.trim() && (
          <p style={p}>
            <b>Informações adicionais:</b> {d.infoContrato}
          </p>
        )}
      </Pagina>

      {/* 2 — Objeto */}
      <Pagina titulo="Contrato comercial" numero={2} total={TOTAL}>
        <H2>CLÁUSULA 1ª — DO OBJETO</H2>
        <p style={p}>
          1.1. O presente contrato tem por objeto o fornecimento e a instalação de sistema fotovoltaico de {formatarNumero(r.potenciaRealKwp)} kWp, no endereço {enderecoUsina(d)}, composto pelos itens abaixo.
        </p>
        <Tabela
          colunas={["Item", "Descrição", "Qtd."]}
          alinhar={["left", "left", "center"]}
          linhas={[
            ["Módulo", `${t(d.modulo.marca)} ${t(d.modulo.modelo)} — ${formatarNumero(d.modulo.potenciaW, 0)} W`, String(r.quantidadeModulos)],
            ...d.inversores.map((i) => ["Inversor", `${t(i.marca)} ${t(i.modelo)} — ${formatarNumero(i.potenciaKw)} kW`, String(i.quantidade)]),
            ...d.outrosKit.map((o) => ["Outros", t(o.nome), String(o.quantidade)]),
            ["Estrutura", t(d.tipoEstrutura), "-"],
          ]}
        />
        <div style={{ height: "5mm" }} />
        <Linha rotulo="Geração mensal garantida" valor={`${formatarNumero(r.geracaoMensalKwh, 0)} kWh`} />
        <Linha rotulo="Garantia de desempenho dos módulos" valor={d.modulo.garantiaDesempenhoAnos ? `${d.modulo.garantiaDesempenhoAnos} anos` : "-"} />
        <Linha rotulo="Garantia de fabricação dos módulos" valor={d.modulo.garantiaFabricacaoAnos ? `${d.modulo.garantiaFabricacaoAnos} anos` : "-"} />
      </Pagina>

      {/* 3 — Preço e pagamento */}
      <Pagina titulo="Contrato comercial" numero={3} total={TOTAL}>
        <H2>CLÁUSULA 2ª — DO PREÇO E DA FORMA DE PAGAMENTO</H2>
        <p style={p}>
          2.1. O valor total do presente contrato é de <b>{formatarBRL(r.valorTotal)}</b> ({valorPorExtenso(r.valorTotal)}), a ser pago da seguinte forma:
        </p>
        <p style={p}>{t(d.clausula211)}</p>
        <p style={p}>{t(d.clausula212)}</p>
      </Pagina>

      {/* 4 — Prazos */}
      <Pagina titulo="Contrato comercial" numero={4} total={TOTAL}>
        <H2>CLÁUSULA 3ª — DOS PRAZOS</H2>
        <p style={p}>
          3.1. A instalação terá início em {formatarDataBR(d.osDataInicio)} e término previsto para {formatarDataBR(d.osDataFim)}, salvo atraso decorrente de fatores alheios à vontade da CONTRATADA.
        </p>
        <p style={p}>3.2. A proposta comercial que originou este contrato é válida até {formatarDataBR(d.validade)}.</p>
      </Pagina>

      {/* 5 — Obrigações */}
      <Pagina titulo="Contrato comercial" numero={5} total={TOTAL}>
        {CLAUSULAS_OBRIGACOES.map((s) => (
          <Secao key={s.titulo} s={s} vars={vars} />
        ))}
      </Pagina>

      {/* 6 — Garantias e rescisão */}
      <Pagina titulo="Contrato comercial" numero={6} total={TOTAL}>
        {CLAUSULAS_GARANTIAS.map((s) => (
          <Secao key={s.titulo} s={s} vars={vars} />
        ))}
      </Pagina>

      {/* 7 — Foro e assinaturas */}
      <Pagina titulo="Contrato comercial" numero={7} total={TOTAL}>
        <H2>CLÁUSULA 8ª — DO FORO</H2>
        <p style={p}>8.1. As partes elegem o foro da comarca de {FORO_CONTRATO} para dirimir quaisquer controvérsias oriundas deste contrato.</p>
        <p style={{ ...p, marginTop: "8mm" }}>E, por estarem justas e contratadas, assinam o presente em duas vias de igual teor.</p>
        <p style={{ ...p, marginTop: "6mm" }}>
          {FORO_CONTRATO}, ____ de ______________ de ________.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14mm", marginTop: "22mm", fontSize: "10pt", textAlign: "center" }}>
          <div>
            <div style={{ borderTop: "0.3mm solid #1a1a1a", paddingTop: "2mm" }}>
              CONTRATANTE
              <br />
              {t(d.clienteNome)}
            </div>
          </div>
          <div>
            <div style={{ borderTop: "0.3mm solid #1a1a1a", paddingTop: "2mm" }}>
              CONTRATADA
              <br />
              {t(CONTRATADA.razaoSocial)}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14mm", marginTop: "18mm", fontSize: "10pt", textAlign: "center" }}>
          {["Testemunha 1", "Testemunha 2"].map((w) => (
            <div key={w} style={{ borderTop: "0.3mm solid #1a1a1a", paddingTop: "2mm" }}>
              {w} — CPF:
            </div>
          ))}
        </div>
      </Pagina>
    </>
  );
}
