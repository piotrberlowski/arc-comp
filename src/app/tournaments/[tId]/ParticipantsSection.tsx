"use client"

import { type ParticipantModel as Participant } from "@/generated/prisma/models/Participant"
import { useState } from "react"
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

