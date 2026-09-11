"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Contact,
  BookUser,
  Filter,
  Wrench,
  Users,
  Calendar,
  Sparkles,
  Wallet,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Grid3x3,
  ChevronDown,
  Plus,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
  Moon,
  Sun,
} from "lucide-react";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { useAuth } from "@/lib/store/AuthContext";
import { useTheme } from "@/lib/store/ThemeContext";
import { hasPermission } from "@/lib/db/permissoes";
import { CARGOS } from "@/lib/db/cargos";
import { UNIDADES, unidadeDoUsuario } from "@/lib/db/unidades";
import { gerarIdSuporte } from "@/lib/support-id";
import { APP_VERSION } from "@/lib/version";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, active: true, permissaoId: "menu.dashboard" },
  { href: "/leads", label: "Leads", icon: Contact, active: true, permissaoId: "menu.leads" },
  { href: "/clientes", label: "Clientes", icon: BookUser, active: true, permissaoId: "menu.clientes" },
  { href: "/funil", label: "Funil", icon: Filter, active: true, permissaoId: "menu.funil" },
  { href: "/instalacoes", label: "Instalações", icon: Wrench, active: true, permissaoId: "menu.instalacoes" },
  { href: "/usuarios", label: "Equipe", icon: Users, active: true, permissaoId: "menu.usuarios" },
  { href: "#", label: "Atividades", icon: Calendar, active: false, permissaoId: "" },
  { href: "#", label: "IA", icon: Sparkles, active: false, permissaoId: "" },
  { href: "#", label: "Financeiro", icon: Wallet, active: false, permissaoId: "" },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/clientes": "Clientes",
  "/funil": "Funil",
  "/instalacoes": "Instalações",
  "/usuarios": "Equipe",
};

function pageTitle(pathname: string | null) {
  if (!pathname) return "";
  const match = Object.keys(TITLES).find((k) => pathname.startsWith(k));
  return match ? TITLES[match] : "";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useCrmData();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [idCopiado, setIdCopiado] = useState(false);
  const cargo = CARGOS.find((c) => c.id === currentUser.cargoId);
  const unidade = unidadeDoUsuario(currentUser);
  const idSuporte = gerarIdSuporte(currentUser.id);

  function copiarIdSuporte() {
    navigator.clipboard?.writeText(idSuporte).then(() => {
      setIdCopiado(true);
      setTimeout(() => setIdCopiado(false), 1500);
    });
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-page-bg">
      {/* Sidebar */}
      <aside className="w-16 shrink-0 bg-sidebar-bg border-r border-black/30 flex flex-col items-center py-4">
        <div className="h-9 w-9 rounded-lg bg-brand flex items-center justify-center font-display font-bold text-text-dark text-sm mb-6">
          Y
        </div>

        <nav className="flex flex-col items-center gap-1 flex-1">
          {NAV.filter((item) => !item.active || hasPermission(currentUser.cargoId, item.permissaoId)).map(
            (item) => {
              const active = item.active && pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.active ? item.href : "#"}
                  title={item.label}
                  aria-disabled={!item.active}
                  className={`group relative h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                    active
                      ? "bg-brand text-text-dark"
                      : item.active
                      ? "text-white/55 hover:bg-white/10 hover:text-white"
                      : "text-white/25 cursor-default"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-text-dark text-white text-xs font-medium px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {item.label}
                  </span>
                </Link>
              );
            }
          )}
        </nav>

        <div className="flex flex-col items-center gap-1">
          <button
            title="Configurações"
            className="h-10 w-10 rounded-lg flex items-center justify-center text-white/55 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Settings size={18} strokeWidth={1.8} />
          </button>
          <button
            title="Ajuda"
            className="h-10 w-10 rounded-lg flex items-center justify-center text-white/55 hover:bg-white/10 hover:text-white transition-colors"
          >
            <HelpCircle size={18} strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-border flex items-center gap-4 px-6">
          <h1 className="font-display font-semibold text-[15px] text-text-dark w-32 shrink-0">
            {pageTitle(pathname)}
          </h1>

          <div className="flex-1 max-w-md relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
            />
            <input
              placeholder="Pesquisar clientes, leads, negócios..."
              className="w-full rounded-lg border border-border bg-panel-bg pl-9 pr-3 py-2 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
          </div>

          <button className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-text-gray hover:text-text-dark transition-colors shrink-0">
            <Plus size={16} />
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              className="relative h-9 w-9 rounded-lg flex items-center justify-center text-text-gray hover:bg-panel-bg hover:text-text-dark transition-colors"
              aria-label="Notificações"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
            </button>
            <button
              className="h-9 w-9 rounded-lg flex items-center justify-center text-text-gray hover:bg-panel-bg hover:text-text-dark transition-colors"
              aria-label="Aplicativos"
            >
              <Grid3x3 size={16} />
            </button>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 pl-2 border-l border-border"
            >
              <div className="h-8 w-8 rounded-full bg-brand-soft text-brand-strong font-display font-semibold text-xs flex items-center justify-center overflow-hidden">
                {currentUser.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.fotoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  currentUser.iniciais
                )}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-[13px] font-semibold text-text-dark">{currentUser.nome}</div>
                <div className="text-[11px] text-text-faint">Unidade: {unidade.nome}</div>
              </div>
              <ChevronDown size={14} className="text-text-faint" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-card-bg shadow-lg z-40 overflow-hidden animate-dropdown-in">
                  {/* Cabeçalho: avatar + nome + unidade */}
                  <div className="px-3.5 py-3 border-b border-border-soft flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-brand-soft text-brand-strong font-display font-semibold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                      {currentUser.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={currentUser.fotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        currentUser.iniciais
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-medium text-text-dark truncate">{currentUser.nome}</p>
                      <p className="text-[11px] text-text-faint truncate">Unidade: {unidade.nome}</p>
                    </div>
                  </div>

                  {/* Logado como / Perfil de usuário */}
                  <div className="px-3.5 py-3 border-b border-border-soft space-y-2.5">
                    <div>
                      <p className="text-[10.5px] font-semibold text-text-faint uppercase tracking-wide mb-0.5">
                        Logado como
                      </p>
                      <p className="text-[12.5px] text-text-dark truncate">{currentUser.email}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold text-text-faint uppercase tracking-wide mb-0.5">
                        Perfil de usuário
                      </p>
                      <p className="text-[12.5px] text-text-dark">{cargo?.nome ?? currentUser.cargoId}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold text-text-faint uppercase tracking-wide mb-1">
                        Unidade
                      </p>
                      {/* Só existe 1 unidade cadastrada hoje — o select já fica pronto pra quando existir mais de uma. */}
                      <select
                        value={unidade.id}
                        disabled={UNIDADES.length <= 1}
                        onChange={() => {}}
                        className="w-full text-[12.5px] rounded-lg border border-border bg-panel-bg px-2.5 py-1.5 text-text-dark outline-none focus:border-brand disabled:opacity-70 disabled:cursor-default"
                      >
                        {UNIDADES.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ID de suporte / Versão */}
                  <div className="px-3.5 py-3 border-b border-border-soft grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <p className="text-[10.5px] font-semibold text-text-faint uppercase tracking-wide">
                          ID de suporte
                        </p>
                        <button
                          onClick={copiarIdSuporte}
                          title="Copiar ID de suporte"
                          className="text-text-faint hover:text-text-dark transition-colors"
                        >
                          {idCopiado ? <Check size={11} className="text-badge-green-text" /> : <Copy size={11} />}
                        </button>
                      </div>
                      <p className="text-[12.5px] text-text-gray">{idSuporte}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold text-text-faint uppercase tracking-wide mb-0.5">
                        Versão
                      </p>
                      <p className="text-[12.5px] text-text-gray">{APP_VERSION}</p>
                    </div>
                  </div>

                  <div className="py-1.5 border-b border-border-soft">
                    <Link
                      href="/configuracoes/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] font-medium text-text-gray hover:bg-panel-bg hover:text-text-dark transition-colors"
                    >
                      <Settings size={15} />
                      Configurações de perfil
                    </Link>
                    <button
                      disabled
                      title="Em breve"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] font-medium text-text-faint cursor-not-allowed"
                    >
                      <ShieldCheck size={15} />
                      Acesso e segurança
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] font-medium text-text-gray hover:bg-panel-bg hover:text-text-dark transition-colors"
                    >
                      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                      {theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
                    </button>
                  </div>

                  <div className="py-1.5">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] font-medium text-red-600 hover:bg-panel-bg transition-colors disabled:opacity-60"
                    >
                      <LogOut size={15} />
                      {loggingOut ? "Saindo..." : "Sair"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-x-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
