"use client"

import { useState } from "react"

export default function ChampionshipCombinedIfafExportButton({
    championshipId,
    championshipName,
}: {
    championshipId: string
    championshipName: string
}) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const response = await fetch("/api/export/ifaf/combined", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ championshipId }),
            })

            if (!response.ok) {
                throw new Error("Export failed")
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `${championshipName}-IFAF-Combined.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("IFAF combined export failed:", error)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button type="button" className="btn btn-primary btn-sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting…" : "Download IFAF XLSX"}
        </button>
    )
}
