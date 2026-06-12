"use client"

import { useState, useTransition } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import type { Lead } from "@crm/db"
import {
  PIPELINE_STAGES,
  STAGE_STYLES,
  LEAD_SOURCES,
  findBilingual,
} from "@crm/shared-lib"
import { updateLeadStatus } from "@/app/actions/leads"
import { cn } from "@crm/shared-lib"
import { Phone, Building2, Banknote, Clock } from "lucide-react"
import { toast } from "sonner"
import { LeadDetailDrawer } from "@/components/lead-detail-drawer"

export function PipelineBoard({
  initialLeads,
  canManage,
  role,
}: {
  initialLeads: Lead[]
  canManage: boolean
  role: string
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [openLeadId, setOpenLeadId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const leadId = Number(draggableId)
    const newStatus = destination.droppableId
    const prev = leads

    // Optimistic update.
    setLeads((cur) =>
      cur.map((l) =>
        l.id === leadId ? { ...l, status: newStatus, statusChangedAt: new Date() } : l,
      ),
    )

    startTransition(async () => {
      const res = await updateLeadStatus(leadId, newStatus)
      if (res?.error) {
        setLeads(prev) // rollback
        toast.error(res.error)
      } else {
        const stage = findBilingual(PIPELINE_STAGES, newStatus)
        toast.success(`تم النقل إلى ${stage?.ar} / Moved to ${stage?.en}`)
      }
    })
  }

  function byStage(status: string) {
    return leads.filter((l) => l.status === status)
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const items = byStage(stage.value)
            const style = STAGE_STYLES[stage.value]
            return (
              <Droppable droppableId={stage.value} key={stage.value}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
                      snapshot.isDraggingOver && "bg-muted",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", style?.dot)} />
                        <span className="text-sm font-semibold text-foreground">{stage.ar}</span>
                        <span className="text-xs text-muted-foreground">/ {stage.en}</span>
                      </div>
                      <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                      {items.map((lead, index) => (
                        <Draggable draggableId={String(lead.id)} index={index} key={lead.id}>
                          {(dragProvided, dragSnapshot) => (
                            <button
                              type="button"
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setOpenLeadId(lead.id)}
                              className={cn(
                                "flex flex-col gap-2 rounded-lg border bg-card p-3 text-right shadow-sm transition-shadow hover:shadow-md",
                                dragSnapshot.isDragging && "shadow-lg ring-2 ring-primary/40",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-card-foreground">{lead.name}</span>
                                {lead.source && (
                                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", style?.badge)}>
                                    {findBilingual(LEAD_SOURCES, lead.source)?.ar ?? lead.source}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                <span dir="ltr">{lead.phone}</span>
                              </div>
                              {lead.project && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Building2 className="h-3.5 w-3.5" />
                                  <span>{lead.project}</span>
                                </div>
                              )}
                              {lead.budget && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Banknote className="h-3.5 w-3.5" />
                                  <span>{lead.budget}</span>
                                </div>
                              )}
                            </button>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {items.length === 0 && (
                        <div className="flex flex-1 items-center justify-center py-6 text-xs text-muted-foreground">
                          <Clock className="ml-1 h-3.5 w-3.5" />
                          لا يوجد / Empty
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

      <LeadDetailDrawer
        leadId={openLeadId}
        open={openLeadId !== null}
        onOpenChange={(o) => !o && setOpenLeadId(null)}
        canManage={canManage}
        role={role}
      />
    </>
  )
}
