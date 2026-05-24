"use client"

import ParticipantCSVUploadForm from "@/components/participants/ParticipantCSVUploadForm"
import { importParticipantsCSV } from "../csvImportActions"

interface CSVUploadFormProps {
    tournamentId: string
    onImportComplete?: (result: { success: boolean; message: string; importedCount: number; errors: string[] }) => void
}

export default function CSVUploadForm({ tournamentId, onImportComplete }: CSVUploadFormProps) {
    return (
        <ParticipantCSVUploadForm
            entityId={tournamentId}
            entityIdFieldName="tId"
            importAction={importParticipantsCSV}
            permalink={`/tournaments/${tournamentId}`}
            submitLabel="Import Participants"
            onImportComplete={onImportComplete}
        />
    )
}
