"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, Filter, LayoutGrid, List, Download, Info } from "lucide-react";
import { Deal, FunnelId } from "@/lib/types";
import { FUNNELS } from "@/lib/funnels";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { hasPermission } from "@/lib/db/permissoes";
import FunnelSwitcher from "./FunnelSwitcher";
import NewDealModal from "./NewDealModal";
import DealDetailPanel from "./DealDetailPanel";

const AVATAR_COLORS = [
  { bg: "#fdece3", text: "#d94c1e" },
  { bg: "#e7f6ec", text: "#2f8a52" },
  { bg: "#e8f0ff", text: "#2f5fd6" },
  { bg: "#f5e9fb", text: "#8b3fc9" },
];

function avatarStyle(initials: string) {
  const idx = initials.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function DealCard({
  deal,
  dragging,
  onOpen,
}: {
  deal: Deal;
  dragging?: boolean;
  onOpen?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const avatar = avatarStyle(deal.responsavel);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen?.(deal.id)}
      className={`bg-card-bg border border-border rounded-lg px-3.5 py-3 cursor-grab active:cursor-grabbing select-none touch-none ${
        isDragging && !dragging ? "opacity-30" : ""
      } ${dragging ? "shadow-md rotate-1" : "hover:border-brand"} transition-colors`}
    >
      <h4 className="font-semibold text-text-dark text-[13px] leading-snug mb-3">
        {deal.titulo}
      </h4>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
            style={{ background: avatar.bg, color: avatar.text }}
          >
            {deal.responsavel}
          </div>
          <span className="text-[12px] font-medium text-text-dark">
            {formatBRL(deal.valor)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Column({
  stageId,
  label,
  deals,
  onOpenDeal,
}: {
  stageId: string;
  label: string;
  deals: Deal[];
  onOpenDeal: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  const total = deals.reduce((sum, d) => sum + d.valor, 0);

  return (
    <div className="flex flex-col w-72 shrink-0 border-r border-border-soft last:border-r-0 pr-4 last:pr-0">
      <div className="px-0.5 mb-3">
        <h3 className="text-[13px] font-semibold text-text-dark mb-0.5">{label}</h3>
        <span className="text-[11px] text-text-faint">
          {deals.length} negócios · {formatBRL(total)}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[140px] rounded-lg p-1 flex-1 transition-colors ${
          isOver ? "bg-brand-soft" : ""
        }`}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onOpen={onOpenDeal} />
        ))}
      </div>
    </div>
  );
}

export default function FunnelBoard() {
  const { deals, addDeal, updateDeal, currentUser } = useCrmData();
  const visibleFunnels = useMemo(
    () => FUNNELS.filter((f) => hasPermission(currentUser.cargoId, `funil.${f.id}`)),
    [currentUser.cargoId]
  );
  const [selectedFunnelId, setSelectedFunnelId] = useState<FunnelId>(() => visibleFunnels[0]?.id ?? FUNNELS[0].id);
  // Se o usuário logado trocar e o funil selecionado deixar de ser permitido, cai pro primeiro visível.
  const funnelId = visibleFunnels.some((f) => f.id === selectedFunnelId)
    ? selectedFunnelId
    : visibleFunnels[0]?.id ?? FUNNELS[0].id;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openDealId, setOpenDealId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const funnel = FUNNELS.find((f) => f.id === funnelId)!;

  const dealsByStage = useMemo(() => {
    const map = new Map<string, Deal[]>();
    funnel.stages.forEach((s) => map.set(s.id, []));
    deals
      .filter((d) => d.funnelId === funnelId)
      .forEach((d) => map.get(d.stageId)?.push(d));
    return map;
  }, [deals, funnel, funnelId]);

  const totalsById = useMemo(() => {
    const result: Record<string, { count: number; total: number }> = {};
    FUNNELS.forEach((f) => {
      const list = deals.filter((d) => d.funnelId === f.id);
      result[f.id] = {
        count: list.length,
        total: list.reduce((sum, d) => sum + d.valor, 0),
      };
    });
    return result;
  }, [deals]);

  const currentDeals = deals.filter((d) => d.funnelId === funnelId);
  const activeDeal = deals.find((d) => d.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const newStage = String(over.id);
    updateDeal(String(active.id), { stageId: newStage });
  }

  function handleCreate(newDeal: Omit<Deal, "id" | "createdAt">) {
    addDeal(newDeal);
    setModalOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <FunnelSwitcher
          funnels={visibleFunnels}
          activeId={funnelId}
          totalsById={totalsById}
          onChange={(id) => setSelectedFunnelId(id as FunnelId)}
        />

        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-sm text-text-gray">
            {currentDeals.length} resultados
            <Info size={13} className="text-text-faint" />
          </span>
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button className="h-9 w-9 flex items-center justify-center bg-brand-soft text-brand-strong">
              <LayoutGrid size={15} />
            </button>
            <button className="h-9 w-9 flex items-center justify-center text-text-faint hover:text-text-gray border-l border-border">
              <List size={15} />
            </button>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-text-gray hover:text-text-dark transition-colors">
            <Filter size={14} />
            Filtros
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors"
          >
            <Plus size={16} />
            Novo negócio
          </button>
          <button className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-text-gray hover:text-text-dark transition-colors">
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="border-b border-border mb-5" />

      <DndContext
        key={funnelId}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {funnel.stages.map((stage) => (
            <Column
              key={stage.id}
              stageId={stage.id}
              label={stage.label}
              deals={dealsByStage.get(stage.id) ?? []}
              onOpenDeal={setOpenDealId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {modalOpen && (
        <NewDealModal
          funnel={funnel}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {openDealId && (
        <DealDetailPanel dealId={openDealId} onClose={() => setOpenDealId(null)} />
      )}
    </div>
  );
}
