"use client"

import { useState, useTransition } from "react"
import { TournamentGroupsData, cleanupGroups } from "../groupActions"
import { useGroupAssignment } from "../TournamentContext"
import GroupCard from "./GroupCard"
import UnassignedParticipants from "./UnassignedParticipants"
import GroupWarningHeader from "./GroupWarningHeader"

export default function GroupAssignmentView({ groupsData }: {
    groupsData: TournamentGroupsData
}) {
    const [draggedParticipant, setDraggedParticipant] = useState<string | null>(null)
    const [isCleanupPending, startCleanupTransition] = useTransition()
    const { handleMoveParticipant } = useGroupAssignment()

    const handleDragStart = (participantId: string) => {
        setDraggedParticipant(participantId)
    }

    const handleDragEnd = () => {
        setDraggedParticipant(null)
    }

    const handleDrop = (groupNumber: number) => {
        if (draggedParticipant) {
            const currentGroup = groupsData.groups.find(g =>
                g.participants.some(p => p.id === draggedParticipant)
            )

            if (currentGroup?.groupNumber !== groupNumber) {
                handleMoveParticipant(draggedParticipant, groupNumber)
            }
        }
        setDraggedParticipant(null)
    }

    // Calculate warning header data
    const allAssignedParticipants = groupsData.groups.flatMap(g => g.participants)
    const notCheckedInCount = allAssignedParticipants.filter(p => !p.checkedIn).length
    const totalAssigned = allAssignedParticipants.length

    const handleCleanup = () => {
        const confirmed = confirm(`Remove ${notCheckedInCount} non-checked-in participants from groups?`)
        if (confirmed) {
            startCleanupTransition(async () => {
                try {
                    await cleanupGroups(groupsData.tournament.id)
                } catch (error) {
                    console.error('Failed to cleanup groups:', error)
                }
            })
        }
    }

    const getGridCols = () => {
        const numGroups = groupsData.groups.length
        if (numGroups <= 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        if (numGroups <= 6) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        if (numGroups <= 9) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    }

    return (
        <div className="w-full p-4 space-y-6">
            {/* Warning Header */}
            <GroupWarningHeader
                totalAssigned={totalAssigned}
                notCheckedInCount={notCheckedInCount}
                onCleanup={handleCleanup}
                isCleanupPending={isCleanupPending}
            />

            {/* Unassigned Participants */}
            <UnassignedParticipants
                participants={groupsData.unassignedParticipants}
                availableGroups={groupsData.groups}
                groupSize={groupsData.tournament.format.groupSize}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            />

            {/* Groups Grid */}
            <div className={`grid ${getGridCols()} gap-4`}>
                {groupsData.groups.map((group) => (
                    <GroupCard
                        key={group.groupNumber}
                        group={group}
                        onDrop={() => handleDrop(group.groupNumber)}
                        draggedParticipant={draggedParticipant}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        availableGroups={groupsData.groups}
                        groupSize={groupsData.tournament.format.groupSize}
                    />
                ))}
            </div>
        </div>
    )
}
