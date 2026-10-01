"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, AtSign } from "lucide-react";
import { useCrmData } from "@/lib/store/CrmDataContext";
import {
  Notificacao,
  ouvirNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
} from "@/lib/firebase/notificacoes";

function formatar(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificacoesBell() {
  const router = useRouter();
  const { currentUser } = useCrmData();
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<Notificacao[]>([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    return ouvirNotificacoes(currentUser.id, setItens, (err) =>
      console.error("Erro ao carregar notificações:", err)
    );
  }, [currentUser?.id]);

  const naoLidas = itens.filter((n) => !n.lida);

  function abrir(n: Notificacao) {
    if (!n.lida) marcarComoLida(n.id).catch((err) => console.error(err));
    setAberto(false);
    if (window.location.pathname.startsWith("/funil")) {
      window.dispatchEvent(new CustomEvent("abrir-negocio", { detail: n.dealId }));
    } else {
      router.push(`/funil?negocio=${n.dealId}`);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="relative h-9 w-9 rounded-lg flex items-center justify-center text-text-gray hover:bg-panel-bg hover:text-text-dark transition-colors"
        aria-label="Notificações"
      >
        <Bell size={16} />
        {naoLidas.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-brand text-text-dark text-[10px] font-semibold flex items-center justify-center">
            {naoLidas.length > 9 ? "9+" : naoLidas.length}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAberto(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card-bg/95 backdrop-blur-md shadow-lg z-40 overflow-hidden animate-dropdown-in">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border-soft">
              <p className="text-[13px] font-semibold text-text-dark">Notificações</p>
              {naoLidas.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    marcarTodasComoLidas(naoLidas.map((n) => n.id)).catch((err) => console.error(err))
                  }
                  className="text-[11.5px] text-brand-strong hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {itens.length === 0 ? (
                <p className="px-3.5 py-6 text-center text-[12.5px] text-text-faint">
                  Você não tem notificações.
                </p>
              ) : (
                itens.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => abrir(n)}
                    className={`w-full text-left flex gap-2.5 px-3.5 py-2.5 border-b border-border-soft last:border-b-0 hover:bg-panel-bg transition-colors ${
                      n.lida ? "" : "bg-brand-soft/40"
                    }`}
                  >
                    <div className="h-7 w-7 rounded-full bg-brand-soft text-brand-strong flex items-center justify-center shrink-0 mt-0.5">
                      <AtSign size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] text-text-dark">
                        <span className="font-semibold">{n.deNome}</span> marcou você em{" "}
                        <span className="font-semibold">{n.dealTitulo}</span>
                      </p>
                      <p className="text-[12px] text-text-gray line-clamp-2">{n.trecho}</p>
                      <p className="text-[11px] text-text-faint mt-0.5">{formatar(n.criadoEm)}</p>
                    </div>
                    {!n.lida && <span className="h-2 w-2 rounded-full bg-brand shrink-0 mt-2" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
