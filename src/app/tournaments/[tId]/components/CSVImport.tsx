"use client"

import { DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import { useActionState, useEffect, useState } from "react"
import { CSVImportState, importParticipantsCSV } from "../participantActions"
import useTournamentContext from "../TournamentContext"
import CSVUploadForm from "./CSVUploadForm"

interface CSVImportProps {
    onImportComplete: (result: { success: boolean; message: string; importedCount: number; errors: string[] }) => void
}

const initialState: CSVImportState = {
    success: false,
    message: "",
    importedCount: 0,
    errors: []
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
    const [csvText, setCsvText] = useState("")
    const tournament = useTournamentContext()

    const [importState, importAction, isPending] = useActionState(
        importParticipantsCSV,
        initialState,
        `/tournaments/${tournament?.getTournamentId()}`
    )

    const handleCsvTextChange = (text: string) => {
        setCsvText(text)
    }

    const handleSubmit = (formData: FormData) => {
        importAction(formData)
    }

    const handleError = (error: string) => {
        onImportComplete({
            success: false,
            message: "Failed to read CSV file",
            importedCount: 0,
            errors: [error]
        })
    }

    // Handle import state changes with useEffect to avoid render-time state updates
    useEffect(() => {
        if (importState.success || importState.errors.length > 0) {
            onImportComplete(importState)
        }
    }, [importState, onImportComplete])

    return (
        <div className="drawer drawer-end">
            <input id="csv-import-drawer" type="checkbox" className="drawer-toggle" />

            <div className="drawer-content">
                <label className="btn drawer-btn text-xs bg-primary color-primary w-32" htmlFor="csv-import-drawer">
                    <DocumentArrowUpIcon className="w-6 h-6" />
                    Import CSV
                </label>
            </div>

            <div className="drawer-side">
                <label htmlFor="csv-import-drawer" className="drawer-overlay"></label>
                <div className="min-h-full w-80 bg-base-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Import Participants</h3>
                        <label htmlFor="csv-import-drawer" className="btn btn-sm btn-circle btn-ghost">✕</label>
                    </div>

                    {tournament && (
                        <CSVUploadForm
                            tournamentId={tournament.getTournamentId()}
                            csvText={csvText}
                            onCsvTextChange={handleCsvTextChange}
                            onSubmit={handleSubmit}
                            isPending={isPending}
                            onError={handleError}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
