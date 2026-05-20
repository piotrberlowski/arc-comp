"use client"

import { Participant } from "@/generated/prisma/browser"
import { PencilIcon, XCircleIcon } from "@heroicons/react/24/outline"
import CheckInButton from "./components/CheckInButton"

export default function ParticipantsListRow({
    participant,
    isPending,
    editingParticipantId,
    onEditParticipant,
    onRefreshParticipants,
    onRemoveParticipant,
}: {
    participant: Participant
    isPending: boolean
    editingParticipantId?: string | null
    onEditParticipant?: (participant: Participant | null) => void
    onRefreshParticipants: () => Promise<void>
    onRemoveParticipant: (participant: Participant) => void
}) {
    return (
        <tr>
            <td>{participant.name}</td>
            <td className="hidden sm:table-cell">{participant.membershipNo || "-"}</td>
            <td>
                {participant.ageGroupId}
                {participant.genderGroup}
                {participant.categoryId}
            </td>
            <td className="hidden md:table-cell">{participant.club || "Independent"}</td>
            <td className="flex gap-2">
                <CheckInButton
                    participant={participant}
                    onUpdate={onRefreshParticipants}
                    disabled={isPending}
                />
                {onEditParticipant && (
                    <button
                        type="button"
                        className="btn btn-info btn-sm"
                        disabled={isPending || editingParticipantId === participant.id}
                        onClick={() => onEditParticipant(participant)}
                    >
                        <PencilIcon className="w-4 h-4" />
                        <span className="hidden md:block">Edit</span>
                    </button>
                )}
                <button
                    type="button"
                    className="btn btn-error btn-sm"
                    disabled={isPending}
                    onClick={() => onRemoveParticipant(participant)}
                >
                    <XCircleIcon className="w-4 h-4" />
                    <span className="hidden md:block">Remove</span>
                </button>
            </td>
        </tr>
    )
}
