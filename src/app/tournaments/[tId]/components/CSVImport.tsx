"use client"

import useTournamentContext from "../TournamentContext"
import ParticipantCSVImport from "@/components/participants/ParticipantCSVImport"
import { importParticipantsCSV } from "../csvImportActions"

interface CSVImportProps {
    onImportComplete: (result: { success: boolean; message: string; importedCount: number; errors: string[] }) => void
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
    const tournament = useTournamentContext()

    if (!tournament) {
        return null
    }

    const tournamentId = tournament.getTournamentId()

    return (
        <ParticipantCSVImport
            drawerId="csv-import-drawer"
            entityId={tournamentId}
            entityIdFieldName="tId"
            importAction={importParticipantsCSV}
            permalink={`/tournaments/${tournamentId}`}
            title="Import Participants"
            submitLabel="Import Participants"
            onImportComplete={onImportComplete}
        />
    )
}
