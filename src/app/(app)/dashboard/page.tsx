"use client";

import { useMemo } from "react";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { CARGOS } from "@/lib/db/cargos";
import { DASHBOARD_WIDGETS } from "@/lib/db/dashboard-widgets";
import { WIDGET_REGISTRY } from "@/components/dashboard/registry";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const { currentUser } = useCrmData();
  const cargo = CARGOS.find((c) => c.id === currentUser.cargoId);

  const widgets = useMemo(
    () =>
      DASHBOARD_WIDGETS.filter((w) => w.cargoId === currentUser.cargoId).sort((a, b) => a.ordem - b.ordem),
    [currentUser.cargoId]
  );

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="rounded-2xl border border-border bg-card-bg p-6">
        <h1 className="font-display font-bold text-xl text-text-dark mb-1.5">
          {greeting()}, {currentUser.nome.split(" ")[0]} 👋
        </h1>
        <p className="text-[13px] text-text-gray">
          Painel de <span className="font-semibold text-text-dark">{cargo?.nome}</span> — aqui está o que
          importa pra você hoje.
        </p>
      </div>

      {/* Widgets — vindos da tabela dashboard_widgets, filtrados pelo cargo do usuário logado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {widgets.map((w) => {
          const Widget = WIDGET_REGISTRY[w.componente];
          if (!Widget) return null;
          return (
            <div key={w.id} className={w.span === 2 ? "sm:col-span-2 lg:col-span-2" : ""}>
              <Widget />
            </div>
          );
        })}
      </div>

      {widgets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-[13px] text-text-faint">
          Nenhum widget configurado para o cargo &quot;{cargo?.nome}&quot; ainda.
        </div>
      )}
    </div>
  );
}
