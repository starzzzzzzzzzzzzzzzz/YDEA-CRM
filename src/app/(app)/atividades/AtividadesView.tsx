"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ListChecks, Mail, MapPin, MessageCircle, Phone, Users, X } from "lucide-react";
import { Atividade, AtividadeTipo, ATIVIDADE_TIPO_LABEL } from "@/lib/types";
import { useAuth } from "@/lib/store/AuthContext";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { useAtividades } from "@/lib/store/AtividadesContext";
import { useToast } from "@/components/ui/Toast";
import { AtividadeDoNegocio, ehDoUsuario, ehParaHoje, estaAtrasada, quandoTexto, dataLocalISO } from "@/lib/atividades";

const ICONE: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  reuniao: Users,
  visita: MapPin,
  tarefa: ListChecks,
};

type Aba = "hoje" | "atrasadas" | "proximas";

const ABAS: { id: Aba; label: string; vazio: string }[] = [
  { id: "hoje", label: "Hoje", vazio: "Nenhuma atividade para hoje." },
  { id: "atrasadas", label: "Atrasadas", vazio: "Nada atrasado. Bom trabalho." },
  { id: "proximas", label: "Próximas", vazio: "Nenhuma atividade agendada para os próximos dias." },
];

function ordenar(a: Atividade, b: Atividade) {
  return (
    a.data.localeCompare(b.data) || (a.horaInicio || "").localeCompare(b.horaInicio || "") || a.titulo.localeCompare(b.titulo)
  );
}

export default function AtividadesView() {
  const router = useRouter();
  const { user } = useAuth();
  const { deals } = useCrmData();
  const { itens, carregando, marcarConcluida } = useAtividades();
  const { showToast } = useToast();

  const [aba, setAba] = useState<Aba>("hoje");
  const [somenteMinhas, setSomenteMinhas] = useState(true);
  const [semProxima, setSemProxima] = useState<{ dealId: string; titulo: string } | null>(null);

  const dealsPorId = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);

  const grupos = useMemo(() => {
    const agora = new Date();
    const hoje = dataLocalISO(agora);
    const visiveis = itens.filter((i) => !somenteMinhas || !user || ehDoUsuario(i.atividade, user));
    const atrasadas: AtividadeDoNegocio[] = [];
    const deHoje: AtividadeDoNegocio[] = [];
    const proximas: AtividadeDoNegocio[] = [];
    for (const i of visiveis) {
      if (estaAtrasada(i.atividade, agora)) atrasadas.push(i);
      else if (ehParaHoje(i.atividade, agora)) deHoje.push(i);
      else if (i.atividade.data > hoje) proximas.push(i);
    }
    const ord = (l: AtividadeDoNegocio[]) => l.sort((x, y) => ordenar(x.atividade, y.atividade));
    return { hoje: ord(deHoje), atrasadas: ord(atrasadas), proximas: ord(proximas) };
  }, [itens, somenteMinhas, user]);

  async function concluir(item: AtividadeDoNegocio) {
    const ficaSemProxima = !itens.some((i) => i.dealId === item.dealId && i.atividade.id !== item.atividade.id);
    try {
      await marcarConcluida(item.dealId, item.atividade.id);
      showToast("Atividade concluída");
      if (ficaSemProxima) {
        setSemProxima({ dealId: item.dealId, titulo: dealsPorId.get(item.dealId)?.titulo ?? "O negócio" });
      }
    } catch {
      showToast("Não foi possível concluir a atividade", "error");
    }
  }

  const lista = grupos[aba];
  const abaAtual = ABAS.find((a) => a.id === aba)!;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl text-text-dark mb-1">Atividades</h1>
        <p className="text-[13px] text-text-gray">
          Tudo o que está agendado nos negócios abertos — conclua aqui ou abra o negócio.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        {ABAS.map((a) => {
          const ativa = a.id === aba;
          const qtd = grupos[a.id].length;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                ativa ? "bg-brand text-text-dark" : "bg-panel-bg text-text-gray hover:text-text-dark"
              }`}
            >
              {a.label}
              <span className={`ml-1.5 ${a.id === "atrasadas" && qtd > 0 && !ativa ? "text-badge-red-text" : ""}`}>
                {qtd}
              </span>
            </button>
          );
        })}
        <span className="flex-1" />
        <select
          value={somenteMinhas ? "minhas" : "todas"}
          onChange={(e) => setSomenteMinhas(e.target.value === "minhas")}
          className="rounded-lg border border-border bg-panel-bg px-3 py-2 text-[13px] text-text-dark outline-none focus:border-brand"
        >
          <option value="minhas">Só as minhas</option>
          <option value="todas">Todos os responsáveis</option>
        </select>
      </div>

      {semProxima && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card-bg px-4 py-3 mb-4 text-[13px] text-text-dark">
          <p className="flex-1">
            <span className="font-semibold">{semProxima.titulo}</span> ficou sem próxima atividade. Agende a próxima para
            o negócio não esfriar.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/funil?negocio=${semProxima.dealId}`)}
            className="rounded-lg bg-brand text-text-dark font-semibold text-[13px] px-3.5 py-2 hover:bg-brand-strong transition-colors"
          >
            Agendar a próxima
          </button>
          <button
            type="button"
            onClick={() => setSemProxima(null)}
            aria-label="Dispensar"
            className="text-text-faint hover:text-text-dark"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {carregando ? (
        <div className="space-y-2">
          {[0, 1, 2].map((n) => (
            <div key={n} className="h-14 rounded-lg bg-panel-bg animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-[13px] text-text-faint">
          {abaAtual.vazio}
        </div>
      ) : (
        <div className="space-y-2 max-w-3xl">
          {lista.map((item) => {
            const { atividade: a } = item;
            const deal = dealsPorId.get(item.dealId);
            const Icone = ICONE[a.tipo];
            const atrasada = estaAtrasada(a);
            return (
              <div
                key={`${item.dealId}-${a.id}`}
                className="flex items-start gap-3 rounded-lg border border-border-soft bg-card-bg p-3"
              >
                <button
                  type="button"
                  onClick={() => concluir(item)}
                  aria-label="Concluir atividade"
                  className="h-5 w-5 rounded-full border-2 border-border mt-0.5 shrink-0 flex items-center justify-center text-transparent hover:border-brand hover:text-brand transition-colors"
                >
                  <Check size={12} />
                </button>
                <Icone size={16} className="text-text-gray mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-text-dark">
                    {ATIVIDADE_TIPO_LABEL[a.tipo]} · {a.titulo}
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push(`/funil?negocio=${item.dealId}`)}
                    className="text-[12px] text-brand-strong hover:underline text-left"
                  >
                    {deal?.titulo ?? "Abrir negócio"}
                  </button>
                  <p className={`text-[11.5px] mt-0.5 ${atrasada ? "text-badge-red-text" : "text-text-faint"}`}>
                    {quandoTexto(a)} · {a.responsavelNome}
                    {a.prioridade === "alta" ? " · Prioridade alta" : ""}
                  </p>
                  {a.observacoes && <p className="text-[12px] text-text-gray mt-1">{a.observacoes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
