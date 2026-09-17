"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, ArrowRight, Users2, KanbanSquare, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/store/AuthContext";
import { LogoMark } from "@/components/ui/Logo";

const DESTAQUES = [
  { icon: Users2, label: "Clientes e negócios num só lugar" },
  { icon: KanbanSquare, label: "Funil de vendas com Kanban" },
  { icon: ShieldCheck, label: "Acesso por cargo, do jeito certo" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, error, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Já logado? manda direto pro dashboard.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(email, senha);
      router.replace("/dashboard");
    } catch {
      // erro já fica disponível em `error`, vindo do AuthContext
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-panel-bg">
      {/* Painel de marca — some em telas pequenas */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-[#3ec6ac] via-[#12b6c1] to-[#1b7cb2]">
        {/* Blobs decorativos */}
        <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
        <div className="absolute top-1/3 right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-white/95 flex items-center justify-center shadow-lg p-1.5">
              <LogoMark size={28} />
            </div>
            <span className="font-display font-bold text-xl text-white lowercase tracking-tight">
              ydea
            </span>
          </div>

          <div>
            <h2 className="font-display font-bold text-[28px] leading-tight text-white mb-3 max-w-sm">
              O CRM da Ydea Solar, feito sob medida.
            </h2>
            <p className="text-white/80 text-sm max-w-xs mb-8">
              Clientes, funil de vendas e equipe — tudo integrado, no ritmo da sua operação.
            </p>
            <div className="space-y-3">
              {DESTAQUES.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <d.icon size={15} className="text-white" />
                  </div>
                  <span className="text-white/90 text-[13.5px] font-medium">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/60 text-xs">© {new Date().getFullYear()} Ydea Energia Solar</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center lg:items-start mb-9">
            <div className="h-14 w-14 lg:hidden flex items-center justify-center mb-4">
              <LogoMark size={52} />
            </div>
            <h1 className="font-display font-bold text-2xl text-text-dark mb-1.5 text-center lg:text-left">
              Bem-vindo de volta
            </h1>
            <p className="text-text-gray text-sm text-center lg:text-left">
              Entre com sua conta pra acessar o CRM.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3 text-[12.5px] text-red-700">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-text-dark mb-1.5"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-xl bg-panel-bg border border-border px-4 py-3 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="senha" className="block text-[13px] font-medium text-text-dark">
                  Senha
                </label>
                <a href="#" className="text-[12.5px] text-brand-strong hover:underline">
                  Esqueci minha senha
                </a>
              </div>
              <div className="relative">
                <input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-panel-bg border border-border px-4 py-3 pr-11 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-gray transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-press w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#12b6c1] to-[#1b7cb2] text-white font-semibold text-sm py-3.5 mt-2 shadow-md hover:shadow-lg hover:brightness-105 active:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                "Entrando..."
              ) : (
                <>
                  Entrar
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-text-faint text-center lg:text-left mt-7">
            Acesso restrito a colaboradores Ydea Solar. Sua conta é criada por um administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
