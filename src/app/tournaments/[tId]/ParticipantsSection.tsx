"use client"

import { useState } from "react"
import { Participant } from "@prisma/client"
import AddParticipantForm from "./AddParticipantForm"
import ParticipantsList from "./ParticipantsList"

interface ParticipantsSectionProps {
    tId: string
    participants: Participant[]
}

export default function ParticipantsSection({ tId, participants }: ParticipantsSectionProps) {
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)

    const handleEditParticipant = (participant: Participant | null) => {
        setEditingParticipant(participant)
    }

    const handleCancelEdit = () => {
        setEditingParticipant(null)
    }

    return (
        <>
            <AddParticipantForm
                key={editingParticipant?.id || 'new'}
                tId={tId}
                participant={editingParticipant}
                onCancel={editingParticipant ? handleCancelEdit : undefined}
            />
            <ParticipantsList
                participants={participants}
                onEditParticipant={handleEditParticipant}
                editingParticipantId={editingParticipant?.id || null}
            />
        </>
    )
}

