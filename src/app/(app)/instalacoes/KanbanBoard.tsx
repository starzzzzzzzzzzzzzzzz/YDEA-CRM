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
import { Plus, MapPin, Zap } from "lucide-react";
import { Lead, STAGES, StageId, TIPO_LABEL } from "@/lib/types";
import { useCrmData } from "@/lib/store/CrmDataContext";
import NewLeadModal from "./NewLeadModal";

const TAG_STYLES: Record<string, string> = {
  urgente: "bg-badge-red-bg text-badge-red-text",
  financiamento: "bg-badge-blue-bg text-badge-blue-text",
  indicação: "bg-badge-green-bg text-badge-green-text",
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function LeadCard({ lead, dragging }: { lead: Lead; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-card-bg border border-border rounded-lg px-3.5 py-3 cursor-grab active:cursor-grabbing select-none touch-none ${
        isDragging && !dragging ? "opacity-30" : ""
      } ${dragging ? "shadow-md rotate-1" : "hover:border-brand"} transition-colors`}
    >
      <h4 className="font-semibold text-text-dark text-[13px] leading-snug mb-1">
        {lead.cliente}
      </h4>
      <p className="flex items-center gap-1 text-[11.5px] text-text-gray mb-2.5">
        <MapPin size={11} className="shrink-0" />
        <span className="truncate">{lead.local}</span>
      </p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-text-gray bg-panel-bg rounded px-1.5 py-0.5">
          {TIPO_LABEL[lead.tipo]}
        </span>
        {lead.potenciaKwp && (
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-strong">
            <Zap size={11} />
            {lead.potenciaKwp} kWp
          </span>
        )}
      </div>

      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {lead.tags.map((tag) => (
            <span
              key={tag}
              className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${
                TAG_STYLES[tag] ?? "bg-panel-bg text-text-gray"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="pt-2.5 border-t border-border-soft flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-brand-soft text-brand-strong text-[10px] font-bold flex items-center justify-center">
            {lead.responsavel.charAt(0)}
          </div>
          <span className="text-[11px] text-text-gray">{lead.responsavel}</span>
        </div>
        <span className="text-[11.5px] font-semibold text-text-dark">
          {formatBRL(lead.valor)}
        </span>
      </div>
    </div>
  );
}

function Column({
  stageId,
  label,
  leads,
}: {
  stageId: StageId;
  label: string;
  leads: Lead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  const total = leads.reduce((sum, l) => sum + l.valor, 0);

  return (
    <div className="flex flex-col w-72 shrink-0 border-r border-border-soft last:border-r-0 pr-4 last:pr-0">
      <div className="px-0.5 mb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-text-dark">{label}</h3>
          <span className="text-[11px] font-semibold text-text-faint bg-panel-bg rounded px-1.5 py-0.5">
            {leads.length}
          </span>
        </div>
        <span className="text-[11px] text-text-faint">{formatBRL(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[120px] rounded-lg p-1 flex-1 transition-colors ${
          isOver ? "bg-brand-soft" : ""
        }`}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="text-center text-[11px] text-text-faint py-6 border border-dashed border-border rounded-lg">
            Sem leads aqui
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { leads, addLead, updateLead } = useCrmData();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const leadsByStage = useMemo(() => {
    const map = new Map<StageId, Lead[]>();
    STAGES.forEach((s) => map.set(s.id, []));
    leads.forEach((lead) => map.get(lead.stage)?.push(lead));
    return map;
  }, [leads]);

  const totalGeral = leads.reduce((sum, l) => sum + l.valor, 0);
  const activeLead = leads.find((l) => l.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const newStage = over.id as StageId;
    updateLead(String(active.id), { stage: newStage });
  }

  function handleCreate(newLead: Omit<Lead, "id" | "stage">) {
    addLead(newLead);
    setModalOpen(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl text-text-dark mb-1">Instalações</h1>
        <p className="text-[13px] text-text-gray">
          Acompanhamento da equipe de campo, do agendamento até a conclusão.
        </p>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-text-gray">
          <span className="font-semibold text-text-dark">{leads.length} negócios</span>
          {" · "}
          {formatBRL(totalGeral)}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand text-text-dark font-semibold text-sm px-4 py-2 hover:bg-brand-strong transition-colors"
        >
          <Plus size={16} />
          Novo negócio
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <Column
              key={stage.id}
              stageId={stage.id}
              label={stage.label}
              leads={leadsByStage.get(stage.id) ?? []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {modalOpen && (
        <NewLeadModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
