"use client"

import { useMemo } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import type { EnrichedLead } from "@/app/actions/my-leads"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"
import { stageColor, stageLabel } from "./stage-colors"
import { ScoreRing } from "./score-ring"
import { AvatarSphere } from "./avatar-sphere"
import { Phone, Building2, Banknote } from "lucide-react"

const BOARD_STAGES = ["New", "Contacted", "FollowUp", "Meeting", "Negotiation", "Won", "Lost"]

export function BoardView({
  leads,
  lang,
  onOpen,
  onMove,
}: {
  leads: EnrichedLead[]
  lang: Lang
  onOpen: (lead: EnrichedLead) => void
  onMove: (lead: EnrichedLead, newStage: string) => void
}) {
  const byStage = useMemo(() => {
    const map = new Map<string, EnrichedLead[]>()
    for (const s of BOARD_STAGES) map.set(s, [])
    for (const l of leads) {
      const key = l.status === "Assigned" ? "New" : l.status
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(l)
    }
    return map
  }, [leads])

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination || destination.droppableId === source.droppableId) return
    const lead = leads.find((l) => l.id === Number(draggableId))
    if (lead) onMove(lead, destination.droppableId)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-4">
        {BOARD_STAGES.map((stage) => {
          const items = byStage.get(stage) ?? []
          const color = stageColor(stage)
          return (
            <Droppable droppableId={stage} key={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex w-64 shrink-0 flex-col rounded-2xl border transition-colors"
                  style={{
                    background: snapshot.isDraggingOver ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)",
                    borderColor: snapshot.isDraggingOver ? `${color}66` : "rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-semibold text-white">{stageLabel(stage, lang)}</span>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                    {items.map((lead, index) => (
                      <Draggable draggableId={String(lead.id)} index={index} key={lead.id}>
                        {(dp, ds) => (
                          <button
                            type="button"
                            ref={dp.innerRef}
                            {...dp.draggableProps}
                            {...dp.dragHandleProps}
                            onClick={() => onOpen(lead)}
                            className="flex flex-col gap-2 rounded-xl border p-2.5 text-start transition-shadow"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              borderColor: ds.isDragging ? `${color}88` : "rgba(255,255,255,0.07)",
                              boxShadow: ds.isDragging ? `0 12px 28px -8px ${color}55` : "none",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <AvatarSphere name={lead.name} size={32} />
                              <span className="flex-1 truncate text-sm font-semibold text-white">{lead.name}</span>
                              <ScoreRing score={lead.meta.score} size={30} />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-white/45">
                              <Phone className="h-3 w-3" />
                              <span dir="ltr" className="truncate">{lead.phone}</span>
                            </div>
                            {lead.project && (
                              <div className="flex items-center gap-1.5 text-xs text-white/45">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{lead.project}</span>
                              </div>
                            )}
                            {lead.budget && (
                              <div className="flex items-center gap-1.5 text-xs text-white/45">
                                <Banknote className="h-3 w-3" />
                                <span className="truncate">{lead.budget}</span>
                              </div>
                            )}
                          </button>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && (
                      <div className="flex flex-1 items-center justify-center py-6 text-xs text-white/25">
                        {tr(lang, "empty")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          )
        })}
      </div>
    </DragDropContext>
  )
}
