"use client"

import { championshipDetailContentClass } from "./championshipDetailLayout"
import ChampionshipRangeNameEdit from "./ChampionshipRangeNameEdit"

export type ChampionshipRangeNameRow = {
    rangeNumber: number
    name: string | null
}

function RangeNameListItem({
    championshipId,
    range,
    readOnly,
}: {
    championshipId: string
    range: ChampionshipRangeNameRow
    readOnly: boolean
}) {
    return (
        <li className="flex items-center min-h-10">
            <ChampionshipRangeNameEdit
                championshipId={championshipId}
                rangeNumber={range.rangeNumber}
                initialName={range.name}
                readOnly={readOnly}
            />
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
        return null
    }

    return (
        <section className="mt-6">
            <h2 className="text-lg font-medium mb-3">Ranges</h2>
            <ul className={`flex flex-col gap-2 ${championshipDetailContentClass}`}>
                {ranges.map((range) => (
                    <RangeNameListItem
                        key={range.rangeNumber}
                        championshipId={championshipId}
                        range={range}
                        readOnly={readOnly}
                    />
                ))}
            </ul>
        </section>
    )
}
