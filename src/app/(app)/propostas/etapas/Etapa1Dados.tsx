"use client";

import { useMemo } from "react";
import { Field, inputClass, inputErrorClass } from "@/components/ui/Field";
import SearchSelect, { SearchSelectItem } from "@/components/ui/SearchSelect";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { UNIDADES } from "@/lib/db/unidades";
import { maskCEP, maskCPF, maskCNPJ, maskPhone, onlyDigits } from "@/lib/masks";
import { ESTADOS_BR } from "@/lib/propostas/constants";
import { dadosIniciais, enderecoDoCliente, formatarEnderecoCadastro } from "@/lib/propostas/dados-iniciais";
import type { Cliente } from "@/lib/types";
import { EtapaProps, Secao } from "../ui";

function maskDocumento(v: string) {
  return onlyDigits(v).length > 11 ? maskCNPJ(v) : maskCPF(v);
}

export default function Etapa1Dados({ dados, set, erros }: EtapaProps) {
  const { deals, clientes, organizacoes, pessoas, currentUser, getOrganizacao, getPessoa } = useCrmData();

  const itensNegocio = useMemo<SearchSelectItem[]>(
    () => deals.map((d) => ({ id: d.id, label: d.titulo, sublabel: getOrganizacao(d.organizacaoId)?.nome ?? getPessoa(d.pessoaId)?.nome })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deals, organizacoes, pessoas]
  );
  const itensCliente = useMemo<SearchSelectItem[]>(
    () => clientes.map((c) => ({ id: c.id, label: c.nome, sublabel: c.codigo })),
    [clientes]
  );

  const negocioSel = itensNegocio.find((i) => i.id === dados.dealId) ?? null;
  const clienteSel = itensCliente.find((i) => i.id === dados.clienteId) ?? null;

  function escolherNegocio(item: SearchSelectItem | null) {
    if (!item) {
      set("dealId", undefined);
      return;
    }
    const deal = deals.find((d) => d.id === item.id);
    if (!deal) return;
    const base = dadosIniciais({
      usuario: currentUser,
      deal,
      organizacao: getOrganizacao(deal.organizacaoId),
      pessoa: getPessoa(deal.pessoaId),
    });
    // Só preenche o que o usuário ainda não digitou.
    set("dealId", deal.id);
    if (!dados.nomeProjeto) set("nomeProjeto", base.nomeProjeto);
    if (!dados.clienteNome) set("clienteNome", base.clienteNome);
    if (!dados.clienteCpfCnpj) set("clienteCpfCnpj", base.clienteCpfCnpj);
    if (!dados.clienteEmail) set("clienteEmail", base.clienteEmail);
    if (!dados.clienteContato) set("clienteContato", base.clienteContato);
    if (!dados.clienteOrganizacao) set("clienteOrganizacao", base.clienteOrganizacao);
    if (!dados.clienteEndereco) set("clienteEndereco", base.clienteEndereco);
    if (!dados.concessionaria) set("concessionaria", base.concessionaria);
    if (!dados.codigoUC) set("codigoUC", base.codigoUC);
    if (!dados.consumoMedioKwh) set("consumoMedioKwh", base.consumoMedioKwh);
    set("fase", base.fase);
  }

  function escolherCliente(item: SearchSelectItem | null) {
    if (!item) {
      set("clienteId", undefined);
      return;
    }
    const cliente: Cliente | undefined = clientes.find((c) => c.id === item.id);
    if (!cliente) return;
    set("clienteId", cliente.id);
    set("clienteNome", cliente.nome);
    set("clienteCpfCnpj", cliente.cnpj ?? cliente.cpf ?? "");
    set("clienteEmail", cliente.email ?? "");
    set("clienteContato", cliente.whatsapp || cliente.telefone || "");
    set("clienteProfissao", cliente.profissao ?? "");
    if (cliente.empresa) set("clienteOrganizacao", cliente.empresa);
    set("clienteEndereco", formatarEnderecoCadastro(cliente));
  }

  function usarEnderecoCliente(marcado: boolean) {
    set("usarEnderecoCliente", marcado);
    if (!marcado) return;
    const deal = deals.find((d) => d.id === dados.dealId);
    const end = enderecoDoCliente({
      cliente: clientes.find((c) => c.id === dados.clienteId),
      organizacao: getOrganizacao(deal?.organizacaoId),
      pessoa: getPessoa(deal?.pessoaId),
    });
    (Object.keys(end) as (keyof typeof end)[]).forEach((k) => set(k, end[k]));
  }

  const cls = (campo: string) => `${inputClass} ${erros[campo] ? inputErrorClass : ""}`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div className="space-y-5">
        <Secao titulo="Parâmetros do projeto">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de proposta" required>
              <select className={inputClass} value={dados.tipoProposta} onChange={() => undefined}>
                <option value="solar">Solar</option>
              </select>
            </Field>
            <Field label="Precificação" required>
              <select className={inputClass} value={dados.modeloPrecificacao} onChange={() => undefined}>
                <option value="nova">Precificação Nova</option>
              </select>
            </Field>
          </div>
        </Secao>

        <Secao titulo="Dados do projeto">
          <Field label="Nome do projeto" required error={erros.nomeProjeto}>
            <input className={cls("nomeProjeto")} value={dados.nomeProjeto} onChange={(e) => set("nomeProjeto", e.target.value)} />
          </Field>
          <Field label="Nome do consultor" required error={erros.consultorNome}>
            <input className={cls("consultorNome")} value={dados.consultorNome} onChange={(e) => set("consultorNome", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="E-mail do consultor">
              <input type="email" className={inputClass} value={dados.consultorEmail} onChange={(e) => set("consultorEmail", e.target.value)} />
            </Field>
            <Field label="Telefone do consultor">
              <input className={inputClass} placeholder="(00) 00000-0000" value={dados.consultorTelefone} onChange={(e) => set("consultorTelefone", maskPhone(e.target.value))} />
            </Field>
          </div>
          <Field label="Endereço base (filial de origem)" required error={erros.enderecoBase}>
            <select className={cls("enderecoBase")} value={dados.enderecoBase} onChange={(e) => set("enderecoBase", e.target.value)}>
              <option value="">Selecione...</option>
              {UNIDADES.filter((u) => u.endereco).map((u) => (
                <option key={u.id} value={u.endereco}>
                  {u.endereco}
                </option>
              ))}
            </select>
          </Field>
        </Secao>

        <Secao titulo="Dados do cliente" subtitulo="Vincule ao negócio e ao cadastro para preencher automaticamente.">
          <Field label="Negócio">
            <SearchSelect items={itensNegocio} value={negocioSel} onChange={escolherNegocio} placeholder="Buscar negócio..." />
          </Field>
          <Field label="Cliente cadastrado">
            <SearchSelect items={itensCliente} value={clienteSel} onChange={escolherCliente} placeholder="Buscar cliente..." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome" required error={erros.clienteNome} className="col-span-2">
              <input className={cls("clienteNome")} value={dados.clienteNome} onChange={(e) => set("clienteNome", e.target.value)} />
            </Field>
            <Field label="CPF/CNPJ">
              <input className={inputClass} value={dados.clienteCpfCnpj} onChange={(e) => set("clienteCpfCnpj", maskDocumento(e.target.value))} />
            </Field>
            <Field label="Número de contato">
              <input className={inputClass} value={dados.clienteContato} onChange={(e) => set("clienteContato", maskPhone(e.target.value))} />
            </Field>
            <Field label="E-mail de contato">
              <input type="email" className={inputClass} value={dados.clienteEmail} onChange={(e) => set("clienteEmail", e.target.value)} />
            </Field>
            <Field label="Organização">
              <input className={inputClass} value={dados.clienteOrganizacao} onChange={(e) => set("clienteOrganizacao", e.target.value)} />
            </Field>
            <Field label="Endereço do cliente" className="col-span-2" hint="Vai no contrato. É diferente do endereço da usina.">
              <input className={inputClass} value={dados.clienteEndereco} onChange={(e) => set("clienteEndereco", e.target.value)} />
            </Field>
          </div>
        </Secao>
      </div>

      <div className="space-y-5">
        <Secao titulo="Endereço de instalação da usina">
          <label className="flex items-center gap-2 text-[13px] text-text-gray">
            <input type="checkbox" checked={dados.usarEnderecoCliente} onChange={(e) => usarEnderecoCliente(e.target.checked)} />
            Usar endereço do cliente
          </label>
          <div className="grid grid-cols-4 gap-4">
            <Field label="Rua" className="col-span-3">
              <input className={inputClass} placeholder="Av. exemplo" value={dados.usinaRua} onChange={(e) => set("usinaRua", e.target.value)} />
            </Field>
            <Field label="Número">
              <input className={inputClass} value={dados.usinaNumero} onChange={(e) => set("usinaNumero", e.target.value)} />
            </Field>
          </div>
          <Field label="Bairro">
            <input className={inputClass} value={dados.usinaBairro} onChange={(e) => set("usinaBairro", e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Cidade" required error={erros.usinaCidade} className="col-span-2">
              <input className={cls("usinaCidade")} value={dados.usinaCidade} onChange={(e) => set("usinaCidade", e.target.value)} />
            </Field>
            <Field label="Estado" required error={erros.usinaEstado}>
              <select className={cls("usinaEstado")} value={dados.usinaEstado} onChange={(e) => set("usinaEstado", e.target.value)}>
                <option value="">UF</option>
                {ESTADOS_BR.map((uf) => (
                  <option key={uf}>{uf}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="CEP">
            <input className={inputClass} placeholder="00000-000" value={dados.usinaCep} onChange={(e) => set("usinaCep", maskCEP(e.target.value))} />
          </Field>
          <Field label="Observação">
            <textarea rows={3} className={inputClass} placeholder="Deixe alguma observação aqui..." value={dados.usinaObservacao} onChange={(e) => set("usinaObservacao", e.target.value)} />
          </Field>
        </Secao>

        <Secao titulo="Outros">
          <Field label="Profissão" hint="Aparece no contrato. Se ficar vazio, sai um traço (-).">
            <input className={inputClass} placeholder="Ex.: Empresário" value={dados.clienteProfissao} onChange={(e) => set("clienteProfissao", e.target.value)} />
          </Field>
        </Secao>
      </div>
    </div>
  );
}
