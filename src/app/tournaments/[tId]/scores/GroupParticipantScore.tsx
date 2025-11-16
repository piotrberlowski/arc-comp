import ScoreInput from "../components/ScoreInput"
import { ParticipantWithScore } from "../scoreActions"

interface GroupParticipantScoreProps {
    participant: ParticipantWithScore
    onScoreChange: (participantId: string, score: number | null) => void
}

export default function GroupParticipantScore({ participant, onScoreChange }: GroupParticipantScoreProps) {
    return (
        <div className="flex items-center justify-between p-2 bg-base-200 rounded">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
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
                    currentScore={participant.participantScore?.score ?? null}
                    onScoreChange={(score) =>
                        onScoreChange(participant.id, score)
                    }
                />
            </div>
        </div>
    )
}

