"use client"

import { DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import { useActionState, useEffect, useState } from "react"
import { CSVImportState, importParticipantsCSV } from "../participantActions"
import useTournamentContext from "../TournamentContext"

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
    const [dragOver, setDragOver] = useState(false)
    const [csvText, setCsvText] = useState("")
    const tournament = useTournamentContext()

    const [importState, importAction, isPending] = useActionState(
        importParticipantsCSV,
        initialState,
        `/tournaments/${tournament?.getTournamentId()}`
    )

    const handleFileUpload = async (file: File) => {
        if (!tournament) return

        try {
            const text = await file.text()
            setCsvText(text)
        } catch (error) {
            onImportComplete({
                success: false,
                message: "Failed to read CSV file",
                importedCount: 0,
                errors: [error instanceof Error ? error.message : "Unknown error"]
            })
        }
    }

    const handleSubmit = (formData: FormData) => {
        if (csvText) {
            formData.set('csvText', csvText)
            importAction(formData)
        }
    }

    const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            handleFileUpload(file)
        }
    }

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault()
        setDragOver(false)

        const file = event.dataTransfer.files[0]
        if (file && file.type === 'text/csv') {
            handleFileUpload(file)
        }
    }

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault()
        setDragOver(true)
    }

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault()
        setDragOver(false)
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
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => document.getElementById('csv-import-drawer')?.click()}
                >
                    <DocumentArrowUpIcon className="w-4 h-4" />
                    Import CSV
                </button>
            </div>

            <div className="drawer-side">
                <label htmlFor="csv-import-drawer" className="drawer-overlay"></label>
                <div className="min-h-full w-80 bg-base-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Import Participants</h3>
                        <label htmlFor="csv-import-drawer" className="btn btn-sm btn-circle btn-ghost">✕</label>
                    </div>

                    <form action={handleSubmit}>
                        <input type="hidden" name="tId" value={tournament?.getTournamentId()} />

                        <div
                            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragOver
                                ? 'border-primary bg-primary/10'
                                : 'border-base-300 hover:border-primary/50'
                                }`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <DocumentArrowUpIcon className="w-8 h-8 mx-auto mb-3 text-base-content/50" />

                            <div className="mb-3">
                                <p className="font-medium mb-1">Drop CSV file here</p>
                                <p className="text-sm text-base-content/70">or click to browse</p>
                            </div>

                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileInput}
                                disabled={isPending}
                                className="hidden"
                                id="csv-upload"
                            />

                            <label
                                htmlFor="csv-upload"
                                className={`btn btn-sm ${isPending ? 'btn-disabled' : 'btn-primary'}`}
                            >
                                {isPending ? 'Processing...' : 'Choose File'}
                            </label>

                            {csvText && (
                                <div className="mt-3">
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="btn btn-success btn-sm"
                                    >
                                        {isPending ? 'Importing...' : 'Import Participants'}
                                    </button>
                                </div>
                            )}

                            <div className="mt-3 text-xs text-base-content/60">
                                <p>Required columns:</p>
                                <p>1. Full Name, 2. Membership Number, 3. Gender (F/M), 4. Age Group ID, 5. Equipment Category ID, 6. Club Name</p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
