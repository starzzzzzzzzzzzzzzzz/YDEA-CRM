import type { Cliente, Deal, Organizacao, Pessoa, Usuario } from "@/lib/types";
import { unidadeDoUsuario } from "@/lib/db/unidades";
import { IRRADIACAO_PADRAO_WH_M2_DIA, TAXA_DESEMPENHO_PADRAO_PCT } from "./proposal-calculations";
import { validadePadrao } from "./proposal-text";
import { CLAUSULA_211_MODELO, CLAUSULA_212_MODELO, NACIONALIDADE_PADRAO } from "./constants";
import type { FaseRede, PropostaDados } from "./types";

export function faseDeTexto(texto?: string): FaseRede {
  const t = (texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (t.includes("tri")) return "trifasico";
  if (t.includes("bi")) return "bifasico";
  return "monofasico";
}

export function novoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function inversorVazio(): PropostaDados["inversores"][number] {
  return {
    id: novoId(),
    marca: "",
    modelo: "",
    potenciaKw: 0,
    tensaoSaida: "V220",
    fase: "monofasico",
    valorUnitario: 0,
    quantidade: 1,
  };
}

type ComEndereco = { endereco?: string; numero?: string; bairro?: string; cidade?: string; estado?: string; cep?: string };

/** "Rua X, 10 - Bairro - Cidade/UF - 00000-000" a partir de um cadastro (vazio se não houver nada). */
export function formatarEnderecoCadastro(f?: ComEndereco): string {
  if (!f) return "";
  const rua = [f.endereco, f.numero].map((s) => (s ?? "").trim()).filter(Boolean).join(", ");
  const cidade = [f.cidade, f.estado].map((s) => (s ?? "").trim()).filter((s) => s && s !== "—").join("/");
  return [rua, (f.bairro ?? "").trim(), cidade, (f.cep ?? "").trim()].filter(Boolean).join(" - ");
}

/** Dados com que o wizard abre: tudo o que dá para tirar do usuário, do negócio e do cadastro. */
export function dadosIniciais(args: {
  usuario: Usuario;
  deal?: Deal;
  organizacao?: Organizacao;
  pessoa?: Pessoa;
  cliente?: Cliente;
}): PropostaDados {
  const { usuario, deal, organizacao, pessoa, cliente } = args;
  const consultorNome = [usuario.nome, usuario.sobrenome].filter(Boolean).join(" ");

  return {
    tipoProposta: "solar",
    modeloPrecificacao: "nova",
    nomeProjeto: deal?.titulo ?? "",
    consultorNome,
    consultorEmail: usuario.email,
    consultorTelefone: usuario.telefone ?? "",
    enderecoBase: unidadeDoUsuario(usuario).endereco ?? "",
    dealId: deal?.id,
    clienteId: cliente?.id,
    clienteNome: cliente?.nome ?? organizacao?.nome ?? pessoa?.nome ?? "",
    clienteCpfCnpj: cliente?.cnpj ?? cliente?.cpf ?? organizacao?.cnpj ?? organizacao?.cpf ?? pessoa?.cpf ?? "",
    clienteEmail: cliente?.email ?? organizacao?.email ?? pessoa?.email ?? "",
    clienteContato: cliente?.whatsapp || cliente?.telefone || organizacao?.whatsapp || organizacao?.telefone || pessoa?.whatsapp || pessoa?.telefone || "",
    clienteOrganizacao: organizacao?.nome ?? cliente?.empresa ?? "",
    clienteProfissao: cliente?.profissao ?? "",
    clienteEndereco: formatarEnderecoCadastro(cliente ?? organizacao ?? pessoa),
    usarEnderecoCliente: false,
    usinaRua: "",
    usinaNumero: "",
    usinaBairro: "",
    usinaCidade: "",
    usinaEstado: "",
    usinaCep: "",
    usinaObservacao: "",

    concessionaria: deal?.concessionaria ?? deal?.distribuidora ?? cliente?.distribuidora ?? "",
    perfilConcessionaria: "B1",
    codigoUC: deal?.numeroUC ?? cliente?.unidadeConsumidora ?? "",
    fase: faseDeTexto(deal?.fase ?? cliente?.tipoLigacao),
    tensao: deal?.tensao ?? "V220",
    consumoMedioKwh: deal?.consumoMedio ?? cliente?.consumoMedio ?? 0,
    tarifaTE: 0,
    tarifaTUSD: 0,
    tarifaFioB: 0,
    taxasAntesSolar: 0,
    taxasDepoisSolar: 0,
    considerarCreditoNoPayback: true,
    taxaDesempenhoPct: TAXA_DESEMPENHO_PADRAO_PCT,
    irradiacaoWhM2Dia: IRRADIACAO_PADRAO_WH_M2_DIA,
    tipoEstrutura: "",
    incluirEstruturaEm: "kit",
    maoDeObra: "",
    validade: validadePadrao(),
    observacao: "",

    modoKit: "manual",
    modulo: { marca: "", modelo: "", potenciaW: 0, valorUnitario: 0 },
    inversores: [inversorVazio()],
    outrosKit: [],
    complementares: [],
    incluirInstalacao: true,
    incluirComissao: false,

    osNumero: "",
    osDataInicio: "",
    osDataFim: "",
    osColaborador: "",
    osColaboradorCpf: "",
    infoContrato: "",
    nacionalidade: NACIONALIDADE_PADRAO,
    clausula211: CLAUSULA_211_MODELO,
    clausula212: CLAUSULA_212_MODELO,
  };
}

/** Preenche o endereço da usina com o do cliente (organização, pessoa ou cadastro). */
export function enderecoDoCliente(args: {
  organizacao?: Organizacao;
  pessoa?: Pessoa;
  cliente?: Cliente;
}): Pick<PropostaDados, "usinaRua" | "usinaNumero" | "usinaBairro" | "usinaCidade" | "usinaEstado" | "usinaCep"> {
  const fonte = args.cliente ?? args.organizacao ?? args.pessoa;
  return {
    usinaRua: fonte?.endereco ?? "",
    usinaNumero: fonte?.numero ?? "",
    usinaBairro: fonte?.bairro ?? "",
    usinaCidade: fonte?.cidade ?? "",
    usinaEstado: fonte?.estado ?? "",
    usinaCep: fonte?.cep ?? "",
  };
}
