"use client"

import ChampionshipRangeNameEdit from "./ChampionshipRangeNameEdit"

export type ChampionshipRangeNameRow = {
    rangeNumber: number
    name: string | null
}

function RangeNameCard({
    championshipId,
    range,
    readOnly,
}: {
    championshipId: string
    range: ChampionshipRangeNameRow
    readOnly: boolean
}) {
    return (
        <li className="card bg-base-200 shadow-sm">
            <div className="card-body gap-3 py-4">
                <span className="text-2xl font-semibold tabular-nums leading-none">{range.rangeNumber}</span>
                <ChampionshipRangeNameEdit
                    championshipId={championshipId}
                    rangeNumber={range.rangeNumber}
                    initialName={range.name}
                    readOnly={readOnly}
                />
            </div>
        </li>
    )
}

export default function ChampionshipRangesSection({
    championshipId,
    ranges,
    readOnly = false,
}: {
    championshipId: string
    ranges: ChampionshipRangeNameRow[]
    readOnly?: boolean
}) {
    if (ranges.length === 0) {
        return <p className="text-base-content/70">No ranges to rename yet.</p>
    }

    return (
        <ul className="grid gap-3 sm:grid-cols-2">
            {ranges.map((range) => (
                <RangeNameCard
                    key={range.rangeNumber}
                    championshipId={championshipId}
                    range={range}
                    readOnly={readOnly}
                />
            ))}
        </ul>
    )
}
