import { formatarDataBR, formatarNumero, valorOuTraco as t } from "@/lib/propostas/proposal-text";
import { H2, Linha, Pagina, Tabela } from "./Pagina";
import { ContextoDocumento, enderecoUsina } from "./dados-documento";

const TOTAL = 2;

export default function DocumentoOS({ ctx }: { ctx: ContextoDocumento }) {
  const { dados: d, r } = ctx;
  const materiais: [string, string, string][] = [
    ["Módulo fotovoltaico", `${t(d.modulo.marca)} ${t(d.modulo.modelo)} — ${formatarNumero(d.modulo.potenciaW, 0)} W`, String(r.quantidadeModulos)],
    ...d.inversores.map((i): [string, string, string] => ["Inversor", `${t(i.marca)} ${t(i.modelo)} — ${formatarNumero(i.potenciaKw)} kW (${t(i.tensaoSaida)})`, String(i.quantidade)]),
    ...d.outrosKit.map((o): [string, string, string] => ["Outros", t(o.nome), String(o.quantidade)]),
    ["Estrutura de fixação", t(d.tipoEstrutura), "-"],
  ];

  return (
    <>
      <Pagina titulo="Ordem de serviço" numero={1} total={TOTAL}>
        <h1 style={{ fontSize: "17pt", fontWeight: 700, margin: "0 0 6mm" }}>Ordem de Serviço nº {t(d.osNumero)}</h1>
        <H2>Execução</H2>
        <Linha rotulo="Data de início" valor={formatarDataBR(d.osDataInicio)} />
        <Linha rotulo="Data de término" valor={formatarDataBR(d.osDataFim)} />
        <Linha rotulo="Responsável (instalador/eletricista)" valor={t(d.osColaborador)} />
        <Linha rotulo="CPF do responsável" valor={t(d.osColaboradorCpf)} />
        <Linha rotulo="Mão de obra" valor={t(d.maoDeObra)} />
        <div style={{ height: "6mm" }} />
        <H2>Cliente e local</H2>
        <Linha rotulo="Cliente" valor={t(d.clienteNome)} />
        <Linha rotulo="Contato" valor={t(d.clienteContato)} />
        <Linha rotulo="Endereço da usina" valor={enderecoUsina(d)} />
        <Linha rotulo="Observação do local" valor={t(d.usinaObservacao)} />
        <div style={{ height: "6mm" }} />
        <H2>Sistema</H2>
        <Linha rotulo="Potência instalada" valor={`${formatarNumero(r.potenciaRealKwp)} kWp`} />
        <Linha rotulo="Proposta de origem" valor={t(d.nomeProjeto)} />
      </Pagina>

      <Pagina titulo="Ordem de serviço" numero={2} total={TOTAL}>
        <H2>Materiais que sobem para a usina</H2>
        <Tabela colunas={["Item", "Descrição", "Qtd."]} alinhar={["left", "left", "center"]} linhas={materiais} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14mm", marginTop: "40mm", fontSize: "10pt", textAlign: "center" }}>
          <div style={{ borderTop: "0.3mm solid #1a1a1a", paddingTop: "2mm" }}>Responsável pela instalação</div>
          <div style={{ borderTop: "0.3mm solid #1a1a1a", paddingTop: "2mm" }}>Cliente / responsável no local</div>
        </div>
      </Pagina>
    </>
  );
}
