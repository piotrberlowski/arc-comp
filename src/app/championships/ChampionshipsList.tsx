"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { competitorsRegisteredLabel } from "./competitorsRegisteredLabel"
import { listMyChampionships, type ChampionshipShellRow } from "./championshipActions"

function ChampionshipSummaryCard({ row }: { row: ChampionshipShellRow }) {
    const dayCount = row.rounds.length
    const regCount = row._count.registrations

    return (
        <div className="card w-full max-w-md bg-base-300 shadow-sm">
            <div className="card-body gap-2">
                <h2 className="card-title text-base md:text-lg">{row.name}</h2>
                <div className="flex flex-wrap gap-2 text-sm">
                    <span className="badge badge-info badge-outline">{row.organizerClub}</span>
                    <span className="badge badge-ghost">{dayCount} day{dayCount === 1 ? "" : "s"}</span>
                    <span className="badge badge-ghost">{competitorsRegisteredLabel(regCount)}</span>
                </div>
                <div className="card-actions justify-end">
                    <Link className="btn btn-primary btn-sm" href={`/championships/${row.id}`}>
                        Open
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function ChampionshipsList() {
    const [rows, setRows] = useState<ChampionshipShellRow[]>([])

    useEffect(() => {
        listMyChampionships().then((data) => {
            setRows(data ?? [])
        })
    }, [])

    if (rows.length === 0) {
        return (
            <p className="text-center text-base-content/70 py-8">
                No championships yet for your organizer clubs.
            </p>
        )
    }

    return (
        <div className="w-full flex flex-wrap gap-4 mt-5 bg-primary p-5 rounded-sm justify-center">
            {rows.map((row) => (
                <ChampionshipSummaryCard key={row.id} row={row} />
            ))}
        </div>
    )
}
