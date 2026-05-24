"use client"

import { DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import type { CSVImportState } from "@/lib/participantCsvImport"
import ParticipantCSVUploadForm from "./ParticipantCSVUploadForm"

export default function ParticipantCSVImport({
    drawerId,
    entityId,
    entityIdFieldName,
    importAction,
    permalink,
    title,
    submitLabel,
    onImportComplete,
}: {
    drawerId: string
    entityId: string
    entityIdFieldName: string
    importAction: (initialState: CSVImportState, formData: FormData) => Promise<CSVImportState>
    permalink?: string
    title: string
    submitLabel: string
    onImportComplete?: (result: CSVImportState) => void
}) {
    return (
        <div className="drawer drawer-end">
            <input id={drawerId} type="checkbox" className="drawer-toggle" />

            <div className="drawer-content">
                <label className="btn drawer-btn text-xs bg-primary color-primary w-32" htmlFor={drawerId}>
                    <DocumentArrowUpIcon className="w-6 h-6" />
                    Import CSV
                </label>
            </div>

            <div className="drawer-side">
                <label htmlFor={drawerId} className="drawer-overlay"></label>
                <div className="min-h-full w-80 bg-base-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <label htmlFor={drawerId} className="btn btn-sm btn-circle btn-ghost">✕</label>
                    </div>

                    <ParticipantCSVUploadForm
                        entityId={entityId}
                        entityIdFieldName={entityIdFieldName}
                        importAction={importAction}
                        permalink={permalink}
                        submitLabel={submitLabel}
                        onImportComplete={onImportComplete}
                    />
                </div>
            </div>
        </div>
    )
}
