"use client"

import type { PublicTournamentGroupsData } from "../championshipResultsActions"
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid"

type PublicParticipantDisplay =
    | PublicTournamentGroupsData["groups"][number]["participants"][number]
    | PublicTournamentGroupsData["unassigned"][number]

export default function PublicParticipantCard({
    participant,
}: {
    participant: PublicParticipantDisplay
}) {
    return (
        <div className="bg-secondary border border-secondary rounded-lg p-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[150px] text-secondary-content">
                    <div className="flex items-center gap-2 flex-wrap">
                        {"isCaptain" in participant && participant.isCaptain ? (
                            <StarIconSolid
                                className="w-4 h-4 text-warning shrink-0"
                                title="Target Captain"
                            />
                        ) : null}
                        <p className="font-medium text-xs sm:text-sm">
                            {participant.competitorNumber ? (
                                <span className="font-mono mr-2">#{participant.competitorNumber}</span>
                            ) : null}
                            {participant.name}
                        </p>
                    </div>
                    {participant.club ? (
                        <p className="text-xs text-secondary-content/60">{participant.club}</p>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
