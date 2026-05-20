"use client"

import { ParticipantWithResult } from "../scoreActions"
import GroupScoreCard from "./GroupScoreCard"

interface GroupScoreViewProps {
    participants: ParticipantWithResult[]
}

interface GroupData {
    groupNumber: number
    participants: ParticipantWithResult[]
    isComplete: boolean
}

function GroupScoreSection({
    groups,
    title,
    bgColor,
}: {
    groups: GroupData[]
    title: string
    bgColor: string
}) {
    return (
        <div className={`${bgColor} rounded-lg p-4 mb-4`}>
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                    <GroupScoreCard
                        key={group.groupNumber}
                        groupNumber={group.groupNumber}
                        participants={group.participants}
                        isComplete={group.isComplete}
                    />
                ))}
            </div>
        </div>
    )
}

export default function GroupScoreView({ participants }: GroupScoreViewProps) {
    // Group participants by group assignment
    const groups = participants.reduce((acc, participant) => {
        const groupNumber = participant.groupAssignment?.groupNumber || 0
        if (!acc[groupNumber]) {
            acc[groupNumber] = []
        }
        acc[groupNumber].push(participant)
        return acc
    }, {} as Record<number, ParticipantWithResult[]>)

    // Convert to array and sort by group number, with participants sorted (target captain first)
    const sortedGroups = Object.entries(groups)
        .map(([groupNumber, participants]) => {
            // Sort participants: target captain first
            const sortedParticipants = participants.sort((a, b) => {
                const aIsCaptain = a.groupAssignment?.isCaptain ?? false
                const bIsCaptain = b.groupAssignment?.isCaptain ?? false
                if (aIsCaptain && !bIsCaptain) return -1
                if (!aIsCaptain && bIsCaptain) return 1
                return 0
            })
            return {
                groupNumber: parseInt(groupNumber),
                participants: sortedParticipants,
                isComplete: participants
                    .filter(p => p.checkedIn)
                    .every(p => !!p.result)
            }
        })
        .sort((a, b) => a.groupNumber - b.groupNumber)

    // Separate into outstanding and complete groups
    const outstandingGroups = sortedGroups.filter(g => !g.isComplete)
    const completeGroups = sortedGroups.filter(g => g.isComplete)

    return (
        <div className="space-y-6">
            {outstandingGroups.length > 0 && (
                <GroupScoreSection
                    groups={outstandingGroups}
                    title="Outstanding Groups"
                    bgColor="bg-warning/10"
                />
            )}

            {completeGroups.length > 0 && (
                <GroupScoreSection
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

