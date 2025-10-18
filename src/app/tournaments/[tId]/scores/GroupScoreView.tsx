"use client"

import ScoreInput from "../components/ScoreInput"
import { ParticipantScoreData } from "../scoreActions"

interface GroupScoreViewProps {
    participants: ParticipantScoreData[]
    onScoreChange: (participantId: string, score: number | null, isComplete: boolean) => void
}

interface GroupData {
    groupNumber: number
    participants: ParticipantScoreData[]
    isComplete: boolean
}

export default function GroupScoreView({ participants, onScoreChange }: GroupScoreViewProps) {
    // Group participants by group assignment
    const groups = participants.reduce((acc, participant) => {
        const groupNumber = participant.participant.groupAssignment?.groupNumber || 0
        if (!acc[groupNumber]) {
            acc[groupNumber] = []
        }
        acc[groupNumber].push(participant)
        return acc
    }, {} as Record<number, ParticipantScoreData[]>)

    // Convert to array and sort by group number
    const sortedGroups = Object.entries(groups)
        .map(([groupNumber, participants]) => ({
            groupNumber: parseInt(groupNumber),
            participants,
            isComplete: participants.every(p => p.isComplete)
        }))
        .sort((a, b) => a.groupNumber - b.groupNumber)

    // Separate into outstanding and complete groups
    const outstandingGroups = sortedGroups.filter(g => !g.isComplete)
    const completeGroups = sortedGroups.filter(g => g.isComplete)

    const GroupSection = ({ groups, title, bgColor }: {
        groups: GroupData[],
        title: string,
        bgColor: string
    }) => (
        <div className={`${bgColor} rounded-lg p-4 mb-4`}>
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                    <div key={group.groupNumber} className="bg-base-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Group {group.groupNumber}</h4>
                            <span className={`badge ${group.isComplete ? 'badge-success' : 'badge-warning'}`}>
                                {group.isComplete ? 'Complete' : 'Outstanding'}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {group.participants.map((participant) => (
                                <div key={participant.participantId} className="flex items-center justify-between p-2 bg-base-200 rounded">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {participant.participant.name}
                                        </p>
                                        <p className="text-xs text-base-content/70">
                                            {participant.participant.ageGroupId}{participant.participant.genderGroup} • {participant.participant.categoryId}
                                        </p>
                                        {participant.participant.club && (
                                            <p className="text-xs text-base-content/60">
                                                {participant.participant.club}
                                            </p>
                                        )}
                                    </div>

                                    <div className="ml-2">
                                        <ScoreInput
                                            currentScore={participant.score}
                                            isComplete={participant.isComplete}
                                            onScoreChange={(score, isComplete) =>
                                                onScoreChange(participant.participantId, score, isComplete)
                                            }
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            {outstandingGroups.length > 0 && (
                <GroupSection
                    groups={outstandingGroups}
                    title="Outstanding Groups"
                    bgColor="bg-warning/10"
                />
            )}

            {completeGroups.length > 0 && (
                <GroupSection
                    groups={completeGroups}
                    title="Complete Groups"
                    bgColor="bg-success/10"
                />
            )}

            {sortedGroups.length === 0 && (
                <div className="text-center py-8 text-base-content/50">
                    <p>No participants with group assignments found.</p>
                </div>
            )}
        </div>
    )
}

