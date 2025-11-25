"use client"

import { GroupAssignment, Participant } from "@/generated/prisma/browser"
import { StarIcon, UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid"
import { useState } from "react"
import { useGroupAssignment } from "../TournamentContext"
import CheckInButton from "../components/CheckInButton"
import GroupSelect from "../components/GroupSelect"

export default function ParticipantCard({
    participant,
    isDraggable = false,
    onDragStart,
    onDragEnd,
    availableGroups,
    groupSize
}: {
    participant: Participant & { groupAssignment: GroupAssignment | null }
    isDraggable?: boolean
    onDragStart?: () => void
    onDragEnd?: () => void
    availableGroups: { groupNumber: number; participants: Participant[] }[]
    groupSize: number
}) {
    const [showGroupSelect, setShowGroupSelect] = useState(false)
    const { handleUnassignParticipant, handleSetTargetCaptain, isPending } = useGroupAssignment()
    const isTargetCaptain = participant.groupAssignment?.isCaptain ?? false

    return (
        <div
            className={`bg-secondary border border-secondary rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
                } ${isPending ? 'opacity-50' : ''} ${!participant.checkedIn ? 'opacity-60 border-dashed bg-secondary/50' : ''}`}
            draggable={isDraggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 text-secondary-content">
                    <div className="flex items-center gap-2">
                        {isTargetCaptain && (
                            <StarIconSolid className="w-4 h-4 text-warning" title="Target Captain" />
                        )}
                        <p className="font-medium text-sm truncate">{participant.name}</p>
                        {!participant.checkedIn && (
                            <span className="badge badge-warning badge-xs">Not Checked In</span>
                        )}
                    </div>
                    <p className="text-xs text-secondary-content/70">
                        {participant.ageGroupId}{participant.genderGroup} • {participant.categoryId}
                    </p>
                    {participant.club && (
                        <p className="text-xs text-secondary-content/60">{participant.club}</p>
                    )}
                </div>
                <div className="flex gap-1">
                    {participant.groupAssignment && !isTargetCaptain && (
                        <button
                            className="btn btn-warning btn-xs"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleSetTargetCaptain(participant.id, participant.groupAssignment!.groupNumber)
                            }}
                            disabled={isPending}
                            title="Set as Target Captain"
                        >
                            <StarIcon className="w-3 h-3" />
                        </button>
                    )}

                    <button
                        className="btn btn-primary btn-xs"
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowGroupSelect(!showGroupSelect)
                        }}
                        disabled={isPending}
                    >
                        <UserPlusIcon className="w-3 h-3" />
                    </button>

                    <CheckInButton
                        participant={participant}
                        compact={true}
                        disabled={isPending}
                    />

                    {participant.groupAssignment && (
                        <button
                            className="btn btn-error btn-xs"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleUnassignParticipant(participant.id)
                            }}
                            disabled={isPending}
                        >
                            <XMarkIcon className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {showGroupSelect && (
                <GroupSelect
                    participantId={participant.id}
                    availableGroups={availableGroups}
                    groupSize={groupSize}
                    onSelect={() => setShowGroupSelect(false)}
                />
            )}
        </div>
    )
}
