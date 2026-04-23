"use client"

import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid"
import ScoreInput from "../components/ScoreInput"
import { ParticipantWithResult } from "../scoreActions"

interface GroupParticipantScoreProps {
    participant: ParticipantWithResult
}

export default function GroupParticipantScore({ participant }: GroupParticipantScoreProps) {
    const isTargetCaptain = participant.groupAssignment?.isCaptain ?? false

    return (
        <div className="flex items-center justify-between p-2 bg-base-200 rounded">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate flex items-center gap-1">
                    {isTargetCaptain && (
                        <StarIconSolid className="w-4 h-4 text-warning" title="Target Captain" />
                    )}
                    {participant.name}
                </p>
                <p className="text-xs text-base-content/70">
                    {participant.ageGroupId}{participant.genderGroup} • {participant.categoryId}
                </p>
                {participant.club && (
                    <p className="text-xs text-base-content/60">
                        {participant.club}
                    </p>
                )}
            </div>

            <div className="ml-2">
                <ScoreInput
                    participantId={participant.id}
                    currentResult={participant.result}
                />
            </div>
        </div>
    )
}

