"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { groupGridColsClassName } from "@/lib/groupGridCols"
import { applyParticipantListView, filterGroupedParticipantsByName, type ParticipantSortKey } from "@/lib/participantListView"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import { useMemo, useState, useSyncExternalStore, useTransition } from "react"
import { useGroupAssignment } from "../TournamentContext"
import ParticipantViewControls from "../components/ParticipantViewControls"
import { TournamentGroupsData, cleanupGroups } from "../groupActions"
import GroupCard from "./GroupCard"
import GroupWarningHeader from "./GroupWarningHeader"
import UnassignedParticipants from "./UnassignedParticipants"

function subscribeNothing(onStoreChange: () => void) {
    void onStoreChange
    return () => {}
}

export default function GroupAssignmentView({ groupsData }: {
    groupsData: TournamentGroupsData
}) {
    const [isCleanupPending, startCleanupTransition] = useTransition()
    const [activeId, setActiveId] = useState<string | null>(null)
    const [nameQuery, setNameQuery] = useState("")
    const [sortKey, setSortKey] = useState<ParticipantSortKey>("name")
    const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false)
    const setError = useErrorContext()
    const { handleMoveParticipant } = useGroupAssignment()
    const visibleUnassigned = useMemo(
        () => applyParticipantListView(groupsData.unassignedParticipants, nameQuery, sortKey),
        [groupsData.unassignedParticipants, nameQuery, sortKey]
    )
    const visibleGroups = useMemo(
        () => filterGroupedParticipantsByName(groupsData.groups, nameQuery),
        [groupsData.groups, nameQuery]
    )

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

    const activeParticipant = activeId
        ? [...groupsData.unassignedParticipants, ...groupsData.groups.flatMap(g => g.participants)].find(p => p.id === activeId)
        : null

    const content = (
        <div className="w-full p-4 space-y-6">
            <ParticipantViewControls
                nameQuery={nameQuery}
                onNameQueryChange={setNameQuery}
                sortKey={sortKey}
                onSortChange={setSortKey}
            />

            <GroupWarningHeader
                totalAssigned={totalAssigned}
                notCheckedInCount={notCheckedInCount}
                onCleanup={handleCleanup}
                isCleanupPending={isCleanupPending}
            />

            <UnassignedParticipants
                participants={visibleUnassigned}
                unassignedTotal={groupsData.unassignedParticipants.length}
                availableGroups={groupsData.groups}
                groupSize={groupsData.tournament.groupSize}
            />

            <div className={`grid ${groupGridColsClassName(groupsData.groups.length)} gap-4`}>
                {visibleGroups.map((group) => (
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
