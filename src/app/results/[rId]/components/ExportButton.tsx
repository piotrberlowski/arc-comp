"use client"

import { useState } from 'react'
import { TournamentResultsData } from '../resultsActions'

interface ExportButtonProps {
    tournamentData: TournamentResultsData
}

export default function ExportButton({ tournamentData }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const response = await fetch('/api/export/ifaf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: tournamentData.tournament.id })
            })

            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = `${tournamentData.tournament.name}-IFAF-Results.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting}
        >
            {isExporting ? 'Exporting...' : 'Download IFAF XLSX'}
        </button>
    )
}
