import { ParticipantWithScore } from "../scoreActions"
import GroupParticipantScore from "./GroupParticipantScore"

interface GroupScoreCardProps {
    groupNumber: number
    participants: ParticipantWithScore[]
    isComplete: boolean
    onScoreChange: (participantId: string, score: number | null) => void
}

export default function GroupScoreCard({ groupNumber, participants, isComplete, onScoreChange }: GroupScoreCardProps) {
    return (
        <div className="bg-base-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Group {groupNumber}</h4>
                <span className={`badge ${isComplete ? 'badge-success' : 'badge-warning'}`}>
                    {isComplete ? 'Complete' : 'Outstanding'}
                </span>
            </div>

            <div className="space-y-2">
                {participants.map((participant) => (
                    <GroupParticipantScore
                        key={participant.id}
                        participant={participant}
                        onScoreChange={onScoreChange}
                    />
                ))}
            </div>
        </div>
    )
}

