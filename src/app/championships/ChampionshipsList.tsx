"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import ChampionshipSummaryCard from "./ChampionshipSummaryCard"
import { listMyChampionships, type ChampionshipShellRow } from "./championshipActions"

export default function ChampionshipsList() {
    const { data: session } = useSession()
    const [rows, setRows] = useState<ChampionshipShellRow[]>([])
    const [includeArchive, setIncludeArchive] = useState(false)

    useEffect(() => {
        listMyChampionships(includeArchive).then((data) => {
            setRows(data ?? [])
        })
    }, [includeArchive])

    function onArchived(id: string) {
        if (!includeArchive) {
            setRows((prev) => prev.filter((row) => row.id !== id))
        }
    }

    function onUnarchived(row: ChampionshipShellRow) {
        setRows((prev) => prev.map((item) => (item.id === row.id ? row : item)))
    }

    if (rows.length === 0) {
        return (
            <>
                <ArchiveToggle includeArchive={includeArchive} onChange={setIncludeArchive} />
                <p className="text-center text-base-content/70 py-8">
                    No championships yet for your organizer clubs.
                </p>
            </>
        )
    }

    return (
        <>
            <ArchiveToggle includeArchive={includeArchive} onChange={setIncludeArchive} />
            <div className="w-full flex flex-wrap gap-4 mt-5 bg-primary p-5 rounded-sm justify-center">
                {rows.map((row) => (
                    <ChampionshipSummaryCard
                        key={row.id}
                        row={row}
                        isAdmin={!!session?.isAdmin}
                        onArchived={onArchived}
                        onUnarchived={onUnarchived}
                    />
                ))}
            </div>
        </>
    )
}

function ArchiveToggle({
    includeArchive,
    onChange,
}: {
    includeArchive: boolean
    onChange: (value: boolean) => void
}) {
    return (
        <div className="divider">
            <label className="label">
                <input
                    type="checkbox"
                    checked={includeArchive}
                    className="checkbox checkbox-accent rounded-lg"
                    onChange={(evt) => onChange(evt.target.checked)}
                />
                <span className="text-accent">Include Archived</span>
            </label>
        </div>
    )
}
