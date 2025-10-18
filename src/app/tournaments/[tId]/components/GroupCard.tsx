"use client"

import { GroupAssignment, Participant } from "@prisma/client";
import ParticipantCard from "./ParticipantCard";

interface GroupCardProps {
    group: { groupNumber: number; participants: (Participant & { groupAssignment: GroupAssignment | null })[] }
    onDrop: () => void
    draggedParticipant: string | null
    onDragStart?: (participantId: string) => void
    onDragEnd?: () => void
    availableGroups: { groupNumber: number; participants: Participant[] }[]
    groupSize: number
}

export default function GroupCard({
    group,
    onDrop,
    onDragStart,
    onDragEnd,
    availableGroups,
    groupSize
}: GroupCardProps) {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const isOddGroup = group.groupNumber % 2 === 1
    const headerBgClass = isOddGroup ? 'bg-primary' : 'bg-neutral'
    const headerTextClass = isOddGroup ? 'text-primary-content' : 'text-neutral-content'

    return (
        <div
            className="bg-base-100 border border-base-300 rounded-lg p-4 min-h-[200px]"
            onDragOver={handleDragOver}
            onDrop={onDrop}
        >
            <div className={`flex items-center justify-between mb-3 p-3 rounded-lg ${headerBgClass} ${headerTextClass}`}>
                <h3 className="font-semibold text-lg">Group {group.groupNumber}</h3>
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
                        onDragStart={() => onDragStart?.(participant.id)}
                        onDragEnd={onDragEnd}
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
