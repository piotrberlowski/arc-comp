"use client"

import { GroupAssignment, Participant } from "@/generated/prisma/browser";
import ParticipantCard from "./ParticipantCard";
import { useDroppable } from "@dnd-kit/core";

interface GroupCardProps {
    group: { groupNumber: number; participants: (Participant & { groupAssignment: GroupAssignment | null })[] }
    availableGroups: { groupNumber: number; participants: Participant[] }[]
    groupSize: number
}

export default function GroupCard({
    group,
    availableGroups,
    groupSize
}: GroupCardProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `group-${group.groupNumber}`,
        data: { groupNumber: group.groupNumber }
    })

    const isOddGroup = group.groupNumber % 2 === 1
    const headerBgClass = isOddGroup ? 'bg-primary' : 'bg-neutral'
    const headerTextClass = isOddGroup ? 'text-primary-content' : 'text-neutral-content'

    return (
        <div
            ref={setNodeRef}
            className={`bg-base-100 border rounded-lg p-4 min-h-[200px] transition-colors ${
                isOver ? 'border-primary border-2 bg-primary/5' : 'border-base-300'
            }`}
        >
            <div className={`flex items-center justify-between mb-3 p-3 rounded-lg ${headerBgClass} ${headerTextClass}`}>
                <h3 className="font-semibold text-lg">Target {group.groupNumber}</h3>
                <span className={`badge badge-sm ${isOddGroup ? 'badge-primary-content' : 'badge-neutral-content'}`}>
                    {group.participants.length} participants
                </span>
            </div>

            <div className="space-y-2">
                {group.participants.map((participant) => (
                    <ParticipantCard
                        key={participant.id}
                        participant={participant}
                        isDraggable={true}
                        availableGroups={availableGroups}
                        groupSize={groupSize}
                    />
                ))}

                {group.participants.length === 0 && (
                    <div className="text-center text-base-content/50 py-4">
                        <p className="text-sm">No participants assigned</p>
                        <p className="text-xs">Drag participants here or use the assign button</p>
                    </div>
                )}
            </div>
        </div>
    )
}
