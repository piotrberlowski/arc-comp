"use client"

import { Participant } from "@prisma/client";
import { useGroupAssignment } from "../TournamentContext";

interface GroupSelectProps {
    participantId: string
    availableGroups: { groupNumber: number; participants: Participant[] }[]
    groupSize: number
    onSelect?: () => void
}

export default function GroupSelect({
    participantId,
    availableGroups,
    groupSize,
    onSelect
}: GroupSelectProps) {
    const { handleAssignParticipant, isPending } = useGroupAssignment()

    const nonFullGroups = availableGroups.filter(group => group.participants.length < groupSize)

    const handleGroupSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const groupNumber = parseInt(e.target.value)
        if (groupNumber && groupNumber > 0) {
            handleAssignParticipant(participantId, groupNumber)
            onSelect?.()
        }
    }

    if (nonFullGroups.length === 0) {
        return (
            <div className="mt-2 pt-2 border-t border-base-300">
                <p className="text-xs text-warning">All groups are full!</p>
            </div>
        )
    }

    return (
        <div
            className="mt-2 pt-2 border-t border-base-300"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="space-y-2">
                <p className="text-xs text-secondary-content/70 mb-2">Select a group:</p>
                <select
                    className="select select-bordered select-sm w-full"
                    onChange={handleGroupSelect}
                    disabled={isPending}
                    defaultValue=""
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="" disabled>Choose a group...</option>
                    {nonFullGroups.map((group) => (
                        <option key={group.groupNumber} value={group.groupNumber}>
                            Target {group.groupNumber} ({group.participants.length}/{groupSize})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
