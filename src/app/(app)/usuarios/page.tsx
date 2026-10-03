"use client";

import { useEffect, useState } from "react";
import { Shield, Trash2, UserPlus, X } from "lucide-react";
import { CARGOS } from "@/lib/db/cargos";
import { FUNCOES } from "@/lib/db/funcoes";
import { FUNNELS, FUNCAO_DO_FUNIL } from "@/lib/funnels";
import { permissoesDoCargo, PERMISSOES } from "@/lib/db/permissoes";
import {
  fetchAllUsuarios,
  UsuarioDoc,
  atualizarCargoUsuario,
  atualizarFuncaoUsuario,
} from "@/lib/firebase/firestore";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { auth } from "@/lib/firebase/config";
import { CargoId, FuncaoId } from "@/lib/types";
import Modal from "@/components/ui/Modal";

type UsuarioRow = UsuarioDoc & { id: string };

export default function UsuariosPage() {
  const { currentUser } = useCrmData();
  const isAdmin = currentUser.cargoId === "admin";

  const [usuarios, setUsuarios] = useState<UsuarioRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [excluindo, setExcluindo] = useState<UsuarioRow | null>(null);

  function reload() {
    fetchAllUsuarios()
      .then((rows) => setUsuarios(rows))
      .catch((err) => {
        console.error(err);
        setError("Não foi possível carregar a lista de usuários do Firestore.");
      });
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleCargoChange(usuarioId: string, novoCargo: CargoId) {
    setSavingId(usuarioId);
    try {
      await atualizarCargoUsuario(usuarioId, novoCargo);
      setUsuarios((prev) =>
        prev ? prev.map((u) => (u.id === usuarioId ? { ...u, cargoId: novoCargo } : u)) : prev
      );
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar o cargo. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleFuncaoChange(usuarioId: string, novaFuncao: FuncaoId | "") {
    setSavingId(usuarioId);
    try {
      await atualizarFuncaoUsuario(usuarioId, novaFuncao);
      setUsuarios((prev) =>
        prev
          ? prev.map((u) => (u.id === usuarioId ? { ...u, funcao: novaFuncao || undefined } : u))
          : prev
      );
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar a função. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-xl text-text-dark mb-1">Equipe</h1>
          <p className="text-[13px] text-text-gray">
            Usuários e cargos do CRM. O cargo define o que a pessoa enxerga — menus, funis e widgets do
            Dashboard. A função define quem é avisado em cada etapa (ex.: Engenharia recebe os projetos
            novos).
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-[12.5px] px-3.5 py-2 hover:bg-brand-strong transition-colors"
          >
            <UserPlus size={14} />
            Adicionar usuário
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {showAddForm && isAdmin && (
        <AddUsuarioForm
          onClose={() => setShowAddForm(false)}
          onCreated={() => {
            setShowAddForm(false);
            reload();
          }}
        />
      )}

      {excluindo && isAdmin && (
        <ConfirmarExclusao
          usuario={excluindo}
          onClose={() => setExcluindo(null)}
          onDeleted={() => {
            setUsuarios((prev) => (prev ? prev.filter((u) => u.id !== excluindo.id) : prev));
            setExcluindo(null);
          }}
        />
      )}

      <div className="rounded-2xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-soft text-left text-[11.5px] uppercase tracking-wide text-text-faint">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Função</th>
              <th className="px-4 py-3 font-medium">Permissões</th>
              <th className="px-4 py-3 font-medium w-12" />
            </tr>
          </thead>
          <tbody>
            {usuarios === null && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[13px] text-text-faint">
                  Carregando usuários do Firestore...
                </td>
              </tr>
            )}
            {usuarios?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[13px] text-text-faint">
                  Nenhum usuário cadastrado ainda. Clique em &quot;Adicionar usuário&quot; pra criar o
                  primeiro.
                </td>
              </tr>
            )}
            {usuarios?.map((u) => {
              const cargo = CARGOS.find((c) => c.id === u.cargoId);
              const permissoes = permissoesDoCargo(u.cargoId);
              return (
                <tr key={u.id} className="border-b border-border-soft last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-brand-soft text-brand-strong font-display font-semibold text-xs flex items-center justify-center shrink-0">
                        {u.iniciais}
                      </div>
                      <span className="font-medium text-text-dark">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-gray">{u.email}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <select
                        value={u.cargoId}
                        disabled={savingId === u.id}
                        onChange={(e) => handleCargoChange(u.id, e.target.value as CargoId)}
                        className="text-[11.5px] font-medium px-2 py-1.5 rounded-md border border-border bg-panel-bg text-text-gray outline-none disabled:opacity-60"
                      >
                        {CARGOS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2 py-1 rounded-md bg-panel-bg text-text-gray">
                        <Shield size={11} />
                        {cargo?.nome ?? u.cargoId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <select
                        value={u.funcao ?? ""}
                        disabled={savingId === u.id}
                        onChange={(e) => handleFuncaoChange(u.id, e.target.value as FuncaoId | "")}
                        className="text-[11.5px] font-medium px-2 py-1.5 rounded-md border border-border bg-panel-bg text-text-gray outline-none disabled:opacity-60"
                      >
                        <option value="">Sem função</option>
                        {FUNCOES.map((fn) => (
                          <option key={fn.id} value={fn.id}>
                            {fn.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11.5px] text-text-gray">
                        {FUNCOES.find((fn) => fn.id === u.funcao)?.nome ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-text-faint">{permissoes.length} permissões</td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && u.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => setExcluindo(u)}
                        title="Excluir usuário"
                        aria-label={`Excluir ${u.nome}`}
                        className="h-7 w-7 rounded-md inline-flex items-center justify-center text-text-faint hover:text-red-600 hover:bg-panel-bg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-card-bg p-4">
        <h2 className="font-display font-semibold text-[13.5px] text-text-dark mb-1">
          Quem é avisado em cada funil
        </h2>
        <p className="text-[12px] text-text-gray mb-3">
          Quando um card é criado, quem tem a função do funil recebe aviso no sino e por e-mail.
        </p>
        <div className="flex flex-wrap gap-2">
          {FUNNELS.filter((fl) => FUNCAO_DO_FUNIL[fl.id]).map((fl) => (
            <span key={fl.id} className="text-[11.5px] font-medium px-2 py-1.5 rounded-md bg-panel-bg text-text-gray">
              {fl.name} → {FUNCOES.find((fn) => fn.id === FUNCAO_DO_FUNIL[fl.id])?.nome}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display font-semibold text-[14.5px] text-text-dark mb-3">Cargos e permissões</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CARGOS.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card-bg p-4">
              <h3 className="font-display font-semibold text-[13.5px] text-text-dark mb-1">{c.nome}</h3>
              <p className="text-[12px] text-text-gray mb-3">{c.descricao}</p>
              <div className="flex flex-wrap gap-1.5">
                {permissoesDoCargo(c.id).map((pId) => {
                  const p = PERMISSOES.find((x) => x.id === pId);
                  return (
                    <span
                      key={pId}
                      className="text-[10.5px] font-medium px-1.5 py-1 rounded bg-panel-bg text-text-faint"
                    >
                      {p?.nome ?? pId}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddUsuarioForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cargoId, setCargoId] = useState<CargoId>("vendedor");
  const [funcao, setFuncao] = useState<FuncaoId | "">("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !senha) return;
    setSaving(true);
    setFormError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sessão não encontrada.");

      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          cargoId,
          funcao: funcao || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível criar o usuário.");

      onCreated();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "Não foi possível criar o usuário.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card-bg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-[14px] text-text-dark">Adicionar usuário</h3>
        <button onClick={onClose} className="text-text-faint hover:text-text-gray">
          <X size={16} />
        </button>
      </div>
      <p className="text-[12.5px] text-text-gray mb-4">
        Cria o login (e-mail + senha) e o cadastro no cargo escolhido de uma vez. Passe o e-mail e a senha
        pra pessoa por um canal seguro.
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-text-gray mb-1.5">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Nome completo"
            className="w-full rounded-lg bg-panel-bg border border-border px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-gray mb-1.5">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="nome@ydeaenergia.com.br"
            className="w-full rounded-lg bg-panel-bg border border-border px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-gray mb-1.5">Senha provisória</label>
          <input
            type="text"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            placeholder="mín. 6 caracteres"
            className="w-full rounded-lg bg-panel-bg border border-border px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-gray mb-1.5">Cargo</label>
          <select
            value={cargoId}
            onChange={(e) => setCargoId(e.target.value as CargoId)}
            className="w-full rounded-lg bg-panel-bg border border-border px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
          >
            {CARGOS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-gray mb-1.5">Função na equipe</label>
          <select
            value={funcao}
            onChange={(e) => setFuncao(e.target.value as FuncaoId | "")}
            className="w-full rounded-lg bg-panel-bg border border-border px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
          >
            <option value="">Sem função</option>
            {FUNCOES.map((fn) => (
              <option key={fn.id} value={fn.id}>
                {fn.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand text-text-dark font-semibold text-[12.5px] px-4 py-2 hover:bg-brand-strong transition-colors disabled:opacity-60"
          >
            {saving ? "Criando..." : "Criar usuário"}
          </button>
        </div>
      </form>
      {formError && <p className="text-[12px] text-red-600 mt-3">{formError}</p>}
    </div>
  );
}

function ConfirmarExclusao({
  usuario,
  onClose,
  onDeleted,
}: {
  usuario: UsuarioRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    setExcluindo(true);
    setErro(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sessão não encontrada.");

      const res = await fetch(`/api/admin/usuarios/${encodeURIComponent(usuario.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível excluir o usuário.");

      onDeleted();
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : "Não foi possível excluir o usuário.");
      setExcluindo(false);
    }
  }

  return (
    <Modal onClose={onClose} widthClass="max-w-md">
      {(fechar) => (
        <div className="p-5">
          <h3 className="font-display font-semibold text-[15px] text-text-dark mb-2">
            Excluir {usuario.nome}?
          </h3>
          <p className="text-[13px] text-text-gray">
            A conta de login ({usuario.email}) é apagada e a pessoa perde o acesso ao CRM na hora. Isso não
            pode ser desfeito. As anotações e atividades que ela escreveu continuam, com o nome dela.
          </p>
          {erro && <p className="text-[12px] text-red-600 mt-3">{erro}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={fechar}
              disabled={excluindo}
              className="rounded-lg border border-border px-4 py-2 text-[12.5px] font-medium text-text-gray hover:bg-panel-bg transition-colors disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={excluindo}
              className="rounded-lg bg-red-600 text-white font-semibold text-[12.5px] px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {excluindo ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
