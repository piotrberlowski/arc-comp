"use client"

import { GroupAssignment, Participant } from "@/generated/prisma/browser"
import { UserPlusIcon } from "@heroicons/react/24/outline"
import ParticipantCard from "./ParticipantCard"

interface UnassignedParticipantsProps {
    participants: (Participant & { groupAssignment: GroupAssignment | null })[]
    availableGroups: { groupNumber: number; participants: Participant[] }[]
    groupSize: number
}

export default function UnassignedParticipants({
    participants,
    availableGroups,
    groupSize
}: UnassignedParticipantsProps) {
    if (participants.length === 0) {
        return null
    }

    return (
        <div className="bg-base-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <UserPlusIcon className="w-6 h-6" />
                Unassigned Participants ({participants.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {participants.map((participant) => (
                    <ParticipantCard
                        key={participant.id}
                        participant={participant}
                        isDraggable={true}
                        availableGroups={availableGroups}
                        groupSize={groupSize}
                    />
                ))}
            </div>
        </div>
    )
}
