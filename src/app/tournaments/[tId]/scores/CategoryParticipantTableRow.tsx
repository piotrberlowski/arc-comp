"use client"

import MedalIcon from "../components/MedalIcon"
import ScoreInput from "../components/ScoreInput"
import { formatParticipantResultDisplay } from "@/lib/scoreUtils"
import { ParticipantWithResult } from "../scoreActions"

export interface ParticipantWithPlace extends ParticipantWithResult {
    place: number
    isCategoryHeader: false
    category: string
    categoryComplete: boolean
    hasUnresolvedTie: boolean
}

export default function CategoryParticipantTableRow({ participant }: { participant: ParticipantWithPlace }) {
    const rowClass = participant.hasUnresolvedTie ? "bg-warning/20 [&>*]:!bg-warning/20" : ""

    return (
        <tr className={rowClass}>
            <td>
                <div className="flex items-center gap-1">
                    <MedalIcon place={participant.place} />
                    <span className="font-mono text-sm font-semibold">
                        {participant.hasUnresolvedTie ? "?" : participant.place}
                    </span>
                </div>
            </td>
            <td>
                <div>
                    <p className="font-medium text-sm">{participant.name}</p>
                    <p className="text-xs text-base-content/70">
                        {participant.ageGroupId}
                        {participant.genderGroup}
                        {participant.hasUnresolvedTie && (
                            <span className="ml-1 text-warning font-medium">(tie)</span>
                        )}
                    </p>
                </div>
            </td>
            <td className="hidden md:table-cell">
                <span className="text-sm">{participant.club || "Independent"}</span>
            </td>
            <td className="hidden md:table-cell">
                <span className="font-mono text-sm">{formatParticipantResultDisplay(participant.result)}</span>
            </td>
            <td>
                <ScoreInput participantId={participant.id} currentResult={participant.result} />
            </td>
        </tr>
    )
}
