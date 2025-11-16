"use client"

import { DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import useTournamentContext from "../TournamentContext"
import CSVUploadForm from "./CSVUploadForm"

interface CSVImportProps {
    onImportComplete: (result: { success: boolean; message: string; importedCount: number; errors: string[] }) => void
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
    const tournament = useTournamentContext()

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
                            onImportComplete={onImportComplete}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
