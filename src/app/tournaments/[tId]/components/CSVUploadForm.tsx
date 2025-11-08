"use client"

import { DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import { useState } from "react"

interface CSVUploadFormProps {
    tournamentId: string
    csvText: string
    onCsvTextChange: (text: string) => void
    onSubmit: (formData: FormData) => void
    isPending: boolean
    onError: (error: string) => void
}

export default function CSVUploadForm({
    tournamentId,
    csvText,
    onCsvTextChange,
    onSubmit,
    isPending,
    onError
}: CSVUploadFormProps) {
    const [dragOver, setDragOver] = useState(false)

    const handleFileUpload = async (file: File) => {
        try {
            const text = await file.text()
            onCsvTextChange(text)
        } catch (error) {
            onError(error instanceof Error ? error.message : "Unknown error")
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

    const handleSubmit = (formData: FormData) => {
        if (csvText) {
            formData.set('csvText', csvText)
            onSubmit(formData)
        }
    }

    return (
        <form action={handleSubmit}>
            <input type="hidden" name="tId" value={tournamentId} />

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
    )
}

