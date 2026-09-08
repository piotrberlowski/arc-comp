"use client"

import type { GroupData } from "../groupActions"
import { UserPlusIcon } from "@heroicons/react/24/outline"
import NoMatchingParticipants from "./NoMatchingParticipants"
import ParticipantCard from "./ParticipantCard"

export default function UnassignedParticipants({
    participants,
    unassignedTotal,
    availableGroups,
    groupSize
}: {
    participants: GroupData["participants"]
    unassignedTotal: number
    availableGroups: GroupData[]
    groupSize: number
}) {
    if (unassignedTotal === 0) {
        return null
    }

    return (
        <div className="bg-base-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <UserPlusIcon className="w-6 h-6" />
                Unassigned Participants ({participants.length})
            </h2>
            {participants.length === 0 ? (
                <NoMatchingParticipants />
            ) : (
                <UnassignedParticipantCards
                    participants={participants}
                    availableGroups={availableGroups}
                    groupSize={groupSize}
                />
            )}
        </div>
    )
}

function UnassignedParticipantCards({
    participants,
    availableGroups,
    groupSize,
}: {
    participants: GroupData["participants"]
    availableGroups: GroupData[]
    groupSize: number
}) {
    return (
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
    )
}
