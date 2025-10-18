"use client"

import { useState } from "react"
import GroupCard from "../components/GroupCard"
import UnassignedParticipants from "../components/UnassignedParticipants"
import { TournamentGroupsData } from "../groupActions"
import { useGroupAssignment } from "../TournamentContext"

interface GroupAssignmentViewProps {
    groupsData: TournamentGroupsData
}

export default function GroupAssignmentView({ groupsData }: GroupAssignmentViewProps) {
    const [draggedParticipant, setDraggedParticipant] = useState<string | null>(null)
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

    const getGridCols = () => {
        const numGroups = groupsData.groups.length
        if (numGroups <= 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        if (numGroups <= 6) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        if (numGroups <= 9) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    }

    return (
        <div className="w-full p-4 space-y-6">
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
