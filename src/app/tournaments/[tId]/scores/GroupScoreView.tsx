"use client"

import { ParticipantWithScore } from "../scoreActions"
import GroupScoreCard from "./GroupScoreCard"

interface GroupScoreViewProps {
    participants: ParticipantWithScore[]
    onScoreChange: (participantId: string, score: number | null) => void
}

interface GroupData {
    groupNumber: number
    participants: ParticipantWithScore[]
    isComplete: boolean
}

export default function GroupScoreView({ participants, onScoreChange }: GroupScoreViewProps) {
    // Group participants by group assignment
    const groups = participants.reduce((acc, participant) => {
        const groupNumber = participant.groupAssignment?.groupNumber || 0
        if (!acc[groupNumber]) {
            acc[groupNumber] = []
        }
        acc[groupNumber].push(participant)
        return acc
    }, {} as Record<number, ParticipantWithScore[]>)

    // Convert to array and sort by group number
    const sortedGroups = Object.entries(groups)
        .map(([groupNumber, participants]) => ({
            groupNumber: parseInt(groupNumber),
            participants,
            isComplete: participants.every(p => !!p.participantScore)
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
                    <GroupScoreCard
                        key={group.groupNumber}
                        groupNumber={group.groupNumber}
                        participants={group.participants}
                        isComplete={group.isComplete}
                        onScoreChange={onScoreChange}
                    />
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

