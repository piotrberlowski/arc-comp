"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import { useEffect, useState, useTransition } from "react"
import { useGroupAssignment } from "../TournamentContext"
import { TournamentGroupsData, cleanupGroups } from "../groupActions"
import GroupCard from "./GroupCard"
import GroupWarningHeader from "./GroupWarningHeader"
import UnassignedParticipants from "./UnassignedParticipants"

export default function GroupAssignmentView({ groupsData }: {
    groupsData: TournamentGroupsData
}) {
    const [isCleanupPending, startCleanupTransition] = useTransition()
    const [activeId, setActiveId] = useState<string | null>(null)
    const [isClient, setIsClient] = useState(false)
    const setError = useErrorContext()
    const { handleMoveParticipant } = useGroupAssignment()

    useEffect(() => {
        setIsClient(true)
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const participantId = active.id as string
        const overId = over.id as string

        // Extract group number from drop zone id
        if (overId.startsWith('group-')) {
            const groupNumber = parseInt(overId.replace('group-', ''))

            const currentGroup = groupsData.groups.find(g =>
                g.participants.some(p => p.id === participantId)
            )
            const targetGroup = groupsData.groups.find(g => g.groupNumber === groupNumber)

            // Check if moving to a different group
            if (currentGroup?.groupNumber !== groupNumber) {
                // Check if target group is full
                if (targetGroup && targetGroup.participants.length >= groupsData.tournament.groupSize) {
                    setError(`Target ${groupNumber} is already full (${targetGroup.participants.length}/${groupsData.tournament.groupSize} participants)`)
                    return
                }

                try {
                    await handleMoveParticipant(participantId, groupNumber)
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to move participant')
                }
            }
        }
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
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to cleanup groups')
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

    const activeParticipant = activeId
        ? [...groupsData.unassignedParticipants, ...groupsData.groups.flatMap(g => g.participants)].find(p => p.id === activeId)
        : null

    const content = (
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
                groupSize={groupsData.tournament.groupSize}
            />

            {/* Groups Grid */}
            <div className={`grid ${getGridCols()} gap-4`}>
                {groupsData.groups.map((group) => (
                    <GroupCard
                        key={group.groupNumber}
                        group={group}
                        availableGroups={groupsData.groups}
                        groupSize={groupsData.tournament.groupSize}
                    />
                ))}
            </div>
        </div>
    )

    if (!isClient) {
        return content
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {content}
            <DragOverlay>
                {activeParticipant && (
                    <div className="bg-secondary border-2 border-primary rounded-lg p-3 shadow-lg opacity-90 cursor-grabbing">
                        <div className="text-secondary-content">
                            <p className="font-medium text-sm">{activeParticipant.name}</p>
                            <p className="text-xs text-secondary-content/70">
                                {activeParticipant.ageGroupId}{activeParticipant.genderGroup} • {activeParticipant.categoryId}
                            </p>
                        </div>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    )
}
