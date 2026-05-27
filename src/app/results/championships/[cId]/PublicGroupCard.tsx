"use client"

import type { PublicTournamentGroup } from "../championshipResultsActions"
import PublicParticipantCard from "./PublicParticipantCard"

export default function PublicGroupCard({ group }: { group: PublicTournamentGroup }) {
    const isOddGroup = group.groupNumber % 2 === 1
    const headerBgClass = isOddGroup ? "bg-primary" : "bg-neutral"
    const headerTextClass = isOddGroup ? "text-primary-content" : "text-neutral-content"

    return (
        <div className="bg-base-100 border border-base-300 rounded-lg p-4 min-h-[200px]">
            <div
                className={`flex items-center justify-between mb-3 p-3 rounded-lg ${headerBgClass} ${headerTextClass}`}
            >
                <h3 className="font-semibold text-lg">Target {group.groupNumber}</h3>
            </div>

            <div className="space-y-2">
                {group.participants.map((participant) => (
                    <PublicParticipantCard key={participant.id} participant={participant} />
                ))}
            </div>
        </div>
    )
}
