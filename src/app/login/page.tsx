"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/store/AuthContext";
import { LogoMark } from "@/components/ui/Logo";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-panel-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 flex items-center justify-center mb-4">
            <LogoMark size={52} />
          </div>
          <h1 className="font-display font-semibold text-xl text-text-dark mb-1">
            Ydea Solar CRM
          </h1>
          <p className="text-text-gray text-sm">Autentique-se para continuar</p>
        </div>

        <div className="bg-card-bg border border-border rounded-xl p-7">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-[12.5px] text-red-700">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-text-gray mb-2 tracking-wide"
              >
                E-MAIL
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-xs font-semibold text-text-gray mb-2 tracking-wide"
              >
                SENHA
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-panel-bg border border-border px-3.5 py-2.5 pr-10 text-sm text-text-dark placeholder:text-text-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-gray"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-text-gray select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword((v) => !v)}
                  className="h-3.5 w-3.5 rounded-sm border-border accent-[var(--brand)]"
                />
                Mostrar senha
              </label>
              <a href="#" className="text-[13px] text-brand-strong hover:text-brand-strong transition-colors">
                Esqueci minha senha
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-text-dark text-white font-semibold text-sm py-2.5 mt-2 hover:brightness-110 active:brightness-95 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-xs text-text-faint text-center mt-6">
          Acesso restrito a colaboradores Ydea Solar. Sua conta é criada por um administrador.
        </p>
      </div>
    </div>
  );
}
