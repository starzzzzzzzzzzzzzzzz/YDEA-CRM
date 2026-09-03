"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Wallet,
  Target,
  Percent,
  Receipt,
  Sun,
  ShieldCheck,
  FileText,
  User,
  Coins,
  Contact,
  ClipboardList,
  Hammer,
  Search,
  Truck,
  PackageCheck,
  CalendarCheck,
  HeartHandshake,
  Smile,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { FUNNELS } from "@/lib/funnels";
import { formatBRL } from "@/lib/masks";
import { KpiCard, ChartCard, CHART_COLORS, PIE_COLORS, isSameMonth, monthLabel } from "./DashboardUI";

const META_MENSAL = 500000;
const COMISSAO_PCT = 0.04;

function useComercial() {
  const { deals } = useCrmData();
  const comercialDeals = deals.filter((d) => d.funnelId === "comercial");
  const emAndamento = comercialDeals.filter((d) => d.status !== "ganho" && d.status !== "perdido");
  const ganhos = comercialDeals.filter((d) => d.status === "ganho");
  const perdidos = comercialDeals.filter((d) => d.status === "perdido");
  return { comercialDeals, emAndamento, ganhos, perdidos };
}

/* ---------------- KPIs — visão geral / Admin ---------------- */

export function KpiPipeline() {
  const { emAndamento } = useComercial();
  const total = emAndamento.reduce((s, d) => s + d.valor, 0);
  return <KpiCard icon={<TrendingUp size={16} />} label="Pipeline" value={formatBRL(total)} hint={`${emAndamento.length} negócios ativos`} />;
}

export function KpiReceitaMes() {
  const now = new Date();
  const { ganhos } = useComercial();
  const receitaMes = ganhos.filter((d) => isSameMonth(d.createdAt, now)).reduce((s, d) => s + d.valor, 0);
  return <KpiCard icon={<Wallet size={16} />} label="Receita (mês)" value={formatBRL(receitaMes)} hint={`${ganhos.length} negócios ganhos no total`} />;
}

export function KpiMetaMes() {
  const now = new Date();
  const { ganhos } = useComercial();
  const receitaMes = ganhos.filter((d) => isSameMonth(d.createdAt, now)).reduce((s, d) => s + d.valor, 0);
  const pct = Math.min(100, Math.round((receitaMes / META_MENSAL) * 100));
  return <KpiCard icon={<Target size={16} />} label="Meta do mês" value={`${pct}%`} hint={`Meta: ${formatBRL(META_MENSAL)}`} />;
}

export function KpiConversao() {
  const { ganhos, perdidos } = useComercial();
  const conversao = ganhos.length + perdidos.length > 0 ? (ganhos.length / (ganhos.length + perdidos.length)) * 100 : 0;
  return <KpiCard icon={<Percent size={16} />} label="Conversão" value={`${conversao.toFixed(0)}%`} hint="Ganhos vs. perdidos" />;
}

export function KpiTicketMedio() {
  const { ganhos } = useComercial();
  const receitaTotal = ganhos.reduce((s, d) => s + d.valor, 0);
  const ticket = ganhos.length > 0 ? receitaTotal / ganhos.length : 0;
  return <KpiCard icon={<Receipt size={16} />} label="Ticket médio" value={formatBRL(ticket)} hint="Por negócio ganho" />;
}

export function KpiProjetosInstalados() {
  const { leads } = useCrmData();
  const n = leads.filter((l) => l.stage === "concluido").length;
  return <KpiCard icon={<Sun size={16} />} label="Projetos instalados" value={String(n)} hint="Pipeline de instalação" />;
}

export function KpiHomologacoes() {
  const { leads } = useCrmData();
  const n = leads.filter((l) => l.stage === "homologacao").length;
  return <KpiCard icon={<ShieldCheck size={16} />} label="Homologações" value={String(n)} hint="Pendentes" />;
}

export function KpiPropostas() {
  const { comercialDeals } = useComercial();
  const n = comercialDeals.filter((d) => d.stageId === "proposta_enviada").length;
  return <KpiCard icon={<FileText size={16} />} label="Propostas" value={String(n)} hint="Aguardando retorno" />;
}

/* ---------------- KPIs — Vendedor ---------------- */

export function KpiMinhasVendas() {
  const { currentUser } = useCrmData();
  const { ganhos } = useComercial();
  const minhas = ganhos.filter((d) => d.responsavel === currentUser.iniciais);
  const total = minhas.reduce((s, d) => s + d.valor, 0);
  return <KpiCard icon={<TrendingUp size={16} />} label="Minhas vendas" value={formatBRL(total)} hint={`${minhas.length} negócios ganhos`} />;
}

export function KpiMeusLeads() {
  const { leads } = useCrmData();
  return <KpiCard icon={<Contact size={16} />} label="Leads" value={String(leads.length)} hint="No pipeline de instalação" />;
}

export function KpiMinhaComissao() {
  const { currentUser } = useCrmData();
  const { ganhos } = useComercial();
  const minhas = ganhos.filter((d) => d.responsavel === currentUser.iniciais);
  const comissao = minhas.reduce((s, d) => s + d.valor, 0) * COMISSAO_PCT;
  return <KpiCard icon={<Coins size={16} />} label="Comissão estimada" value={formatBRL(comissao)} hint={`${(COMISSAO_PCT * 100).toFixed(0)}% sobre vendas ganhas`} />;
}

/* ---------------- KPIs — Projetista ---------------- */

function useEngenharia() {
  const { deals } = useCrmData();
  return deals.filter((d) => d.funnelId === "engenharia");
}

export function KpiProjetosPendentes() {
  const eng = useEngenharia();
  const n = eng.filter((d) => d.stageId === "onboard" || d.stageId === "visita_tecnica").length;
  return <KpiCard icon={<ClipboardList size={16} />} label="Projetos pendentes" value={String(n)} hint="Onboard + visita técnica" />;
}

export function KpiProjetosAndamento() {
  const eng = useEngenharia();
  const n = eng.filter((d) => d.stageId === "projeto" || d.stageId === "projeto_analise").length;
  return <KpiCard icon={<Hammer size={16} />} label="Projetos em andamento" value={String(n)} hint="Em elaboração/análise" />;
}

export function KpiVistoriasAgendadas() {
  const eng = useEngenharia();
  const { leads } = useCrmData();
  const n = eng.filter((d) => d.stageId === "vistoria").length + leads.filter((l) => l.stage === "vistoria").length;
  return <KpiCard icon={<Search size={16} />} label="Vistorias agendadas" value={String(n)} hint="Funil + pipeline de instalação" />;
}

/* ---------------- KPIs — Financeiro ---------------- */

export function KpiReceitaTotal() {
  const { ganhos } = useComercial();
  const total = ganhos.reduce((s, d) => s + d.valor, 0);
  return <KpiCard icon={<Wallet size={16} />} label="Receita total" value={formatBRL(total)} hint={`${ganhos.length} contratos fechados`} />;
}

export function KpiFinanciamentoPendente() {
  const { comercialDeals } = useComercial();
  const list = comercialDeals.filter((d) => d.stageId === "aguardando_financiamento");
  const total = list.reduce((s, d) => s + d.valor, 0);
  return <KpiCard icon={<ArrowUpRight size={16} />} label="Aguardando financiamento" value={formatBRL(total)} hint={`${list.length} negócios`} />;
}

/* ---------------- KPIs — Instalação ---------------- */

export function KpiInstalacoesHoje() {
  const { leads } = useCrmData();
  const n = leads.filter((l) => l.stage === "instalacao").length;
  return <KpiCard icon={<Truck size={16} />} label="Instalações agendadas" value={String(n)} hint="Pipeline de instalação" />;
}

export function KpiComissionamento() {
  const { leads } = useCrmData();
  const n = leads.filter((l) => l.stage === "comissionamento").length;
  return <KpiCard icon={<PackageCheck size={16} />} label="Comissionamento" value={String(n)} hint="Pendentes" />;
}

export function KpiConcluidas() {
  const { leads } = useCrmData();
  const n = leads.filter((l) => l.stage === "concluido").length;
  return <KpiCard icon={<CalendarCheck size={16} />} label="Concluídas" value={String(n)} hint="No pipeline de instalação" />;
}

/* ---------------- KPIs — Pós-venda ---------------- */

function useFunilCount(funnelId: string, excludeStages: string[] = []) {
  const { deals } = useCrmData();
  return deals.filter((d) => d.funnelId === funnelId && !excludeStages.includes(d.stageId));
}

export function KpiAcompanhamentosAtivos() {
  const list = useFunilCount("pos_acompanhamento", ["negociacao_comercial"]);
  return <KpiCard icon={<HeartHandshake size={16} />} label="Acompanhamentos ativos" value={String(list.length)} hint="Pós-venda" />;
}

export function KpiNpsPendentes() {
  const list = useFunilCount("pos_nps");
  return <KpiCard icon={<Smile size={16} />} label="NPS pendentes" value={String(list.length)} hint="Aguardando resposta" />;
}

export function KpiAmpliacoes() {
  const list = useFunilCount("pos_ampliacao");
  return <KpiCard icon={<Zap size={16} />} label="Ampliações em andamento" value={String(list.length)} hint="Serviços adicionais" />;
}

export function KpiGestaoEnergetica() {
  const list = useFunilCount("pos_gestao_energetica");
  return <KpiCard icon={<User size={16} />} label="Gestão energética" value={String(list.length)} hint="Clientes ativos" />;
}

/* ---------------- Gráficos ---------------- */

export function ChartPipelineEtapa() {
  const { comercialDeals } = useComercial();
  const funnel = FUNNELS.find((f) => f.id === "comercial")!;
  const data = funnel.stages.map((s) => ({
    etapa: s.label,
    valor: comercialDeals.filter((d) => d.stageId === s.id).reduce((sum, d) => sum + d.valor, 0),
  }));
  return (
    <ChartCard title="Pipeline por etapa (Comercial)">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: CHART_COLORS.gray }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.gray }} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip formatter={(v) => formatBRL(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="valor" fill={CHART_COLORS.brand} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ChartPipelineEngenharia() {
  const eng = useEngenharia();
  const funnel = FUNNELS.find((f) => f.id === "engenharia")!;
  const data = funnel.stages.map((s) => ({
    etapa: s.label,
    quantidade: eng.filter((d) => d.stageId === s.id).length,
  }));
  return (
    <ChartCard title="Projetos por etapa (Engenharia)">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: CHART_COLORS.gray }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.gray }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="quantidade" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ChartVendasMes() {
  const { ganhos } = useComercial();
  const map = new Map<string, number>();
  ganhos
    .filter((d) => d.createdAt)
    .forEach((d) => {
      const key = d.createdAt!.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + d.valor);
    });
  const data = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, valor]) => ({ mes: monthLabel(`${key}-01`), valor }));
  return (
    <ChartCard title="Vendas por mês">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: CHART_COLORS.gray }} />
          <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.gray }} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip formatter={(v) => formatBRL(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Line type="monotone" dataKey="valor" stroke={CHART_COLORS.brandStrong} strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ChartFunis() {
  const { deals } = useCrmData();
  const data = FUNNELS.map((f) => ({
    funil: f.name,
    valor: deals.filter((d) => d.funnelId === f.id).reduce((sum, d) => sum + d.valor, 0),
  }));
  return (
    <ChartCard title="Valor em negociação por funil">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.gray }} tickFormatter={(v) => `${v / 1000}k`} />
          <YAxis type="category" dataKey="funil" tick={{ fontSize: 11, fill: CHART_COLORS.gray }} width={140} />
          <Tooltip formatter={(v) => formatBRL(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="valor" fill={CHART_COLORS.brand} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ChartPosVendaFunis() {
  const { deals } = useCrmData();
  const posFunis = FUNNELS.filter((f) => f.id.startsWith("pos_"));
  const data = posFunis.map((f) => ({
    funil: f.name.replace("Pós - ", ""),
    negocios: deals.filter((d) => d.funnelId === f.id).length,
  }));
  return (
    <ChartCard title="Negócios por funil de pós-venda">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.gray }} allowDecimals={false} />
          <YAxis type="category" dataKey="funil" tick={{ fontSize: 11, fill: CHART_COLORS.gray }} width={160} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="negocios" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ChartOrigem() {
  const { deals } = useCrmData();
  const map = new Map<string, number>();
  deals.forEach((d) => {
    if (!d.canalOrigem) return;
    map.set(d.canalOrigem, (map.get(d.canalOrigem) ?? 0) + 1);
  });
  const data = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  return (
    <ChartCard title="Origem dos negócios">
      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-[12.5px] text-text-faint">
          Sem dados de canal de origem ainda.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
        {data.map((o, i) => (
          <span key={o.name} className="flex items-center gap-1.5 text-[11.5px] text-text-gray">
            <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            {o.name} ({o.value})
          </span>
        ))}
      </div>
    </ChartCard>
  );
}

export function ChartDistribuidoras() {
  const { deals } = useCrmData();
  const map = new Map<string, number>();
  deals.forEach((d) => {
    if (!d.distribuidora) return;
    map.set(d.distribuidora, (map.get(d.distribuidora) ?? 0) + 1);
  });
  const data = Array.from(map.entries()).map(([distribuidora, negocios]) => ({ distribuidora, negocios }));
  return (
    <ChartCard title="Negócios por distribuidora">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="distribuidora" tick={{ fontSize: 11, fill: CHART_COLORS.gray }} />
          <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.gray }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="negocios" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ChartPotencia() {
  const { ganhos } = useComercial();
  const potenciaVendida = ganhos.reduce((s, d) => s + (d.potenciaSistema ?? 0), 0);
  const map = new Map<string, number>();
  ganhos
    .filter((d) => d.createdAt)
    .forEach((d) => {
      const key = d.createdAt!.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + (d.potenciaSistema ?? 0));
    });
  const data = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, kwp]) => ({ mes: monthLabel(`${key}-01`), kwp: Number(kwp.toFixed(1)) }));

  return (
    <ChartCard title="Potência vendida">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-brand-soft text-brand-strong flex items-center justify-center shrink-0">
          <Sun size={18} />
        </div>
        <div>
          <p className="font-display font-bold text-2xl text-text-dark leading-none">
            {potenciaVendida.toFixed(1)} <span className="text-sm font-medium text-text-faint">kWp</span>
          </p>
          <p className="text-[11.5px] text-text-faint mt-1">Total em negócios ganhos</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 10, fill: CHART_COLORS.gray }} />
          <YAxis hide />
          <Tooltip formatter={(v) => `${Number(v)} kWp`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="kwp" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ChartLeadsPorEtapa() {
  const { leads } = useCrmData();
  const STAGE_LABELS: Record<string, string> = {
    novo_lead: "Novo lead",
    vistoria: "Vistoria",
    documentacao: "Documentação",
    projeto: "Projeto",
    homologacao: "Homologação",
    instalacao: "Instalação",
    comissionamento: "Comissionamento",
    concluido: "Concluído",
  };
  const map = new Map<string, number>();
  leads.forEach((l) => map.set(l.stage, (map.get(l.stage) ?? 0) + 1));
  const data = Object.entries(STAGE_LABELS).map(([id, label]) => ({ etapa: label, quantidade: map.get(id) ?? 0 }));
  return (
    <ChartCard title="Pipeline de instalação por etapa">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: CHART_COLORS.gray }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.gray }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="quantidade" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
