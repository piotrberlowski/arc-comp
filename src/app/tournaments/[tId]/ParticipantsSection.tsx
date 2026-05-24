"use client"

import { type ParticipantModel as Participant } from "@/generated/prisma/models/Participant"
import type { ChampionshipDayLink } from "@/app/tournaments/tournamentActions"
import { useState } from "react"
import AddParticipantForm from "./AddParticipantForm"
import ChampionshipDayParticipantsNotice from "./ChampionshipDayParticipantsNotice"
import ParticipantsList from "./ParticipantsList"

export default function ParticipantsSection({
    tId,
    participants,
    championshipDay = null,
}: {
    tId: string
    participants: Participant[]
    championshipDay?: ChampionshipDayLink | null
}) {
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
    const isChampionshipDay = championshipDay !== null

    const handleEditParticipant = (participant: Participant | null) => {
        setEditingParticipant(participant)
    }

    const handleCancelEdit = () => {
        setEditingParticipant(null)
    }

    return (
        <>
            {isChampionshipDay ? (
                <ChampionshipDayParticipantsNotice championshipDay={championshipDay} />
            ) : (
                <AddParticipantForm
                    key={editingParticipant?.id || "new"}
                    tId={tId}
                    participant={editingParticipant}
                    onCancel={editingParticipant ? handleCancelEdit : undefined}
                />
            )}
            <ParticipantsList
                participants={participants}
                allowImportAndEdit={!isChampionshipDay}
                onEditParticipant={isChampionshipDay ? undefined : handleEditParticipant}
                editingParticipantId={editingParticipant?.id || null}
            />
        </>
    )
}
