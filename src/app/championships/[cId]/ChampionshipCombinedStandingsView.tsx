"use client"

import type { ChampionshipCombinedStandings } from "@/lib/championshipCombinedStandings"
import { championshipDetailContentClass } from "./championshipDetailLayout"

const PLACE_COL = "3.25rem"
const NUMBER_COL = "3.25rem"
const CLUB_COL = "14rem"
const DAY_COL = "4.5rem"
const TOTAL_COL = "4.5rem"

function combinedStandingsMinWidth(dayCount: number): string {
    return `calc(${PLACE_COL} + ${NUMBER_COL} + 12rem + ${CLUB_COL} + ${dayCount * 4.5}rem + ${TOTAL_COL})`
}

function CombinedStandingsColGroup({ dayCount }: { dayCount: number }) {
    return (
        <colgroup>
            <col style={{ width: PLACE_COL }} />
            <col style={{ width: NUMBER_COL }} />
            <col />
            <col className="hidden md:table-column" style={{ width: CLUB_COL }} />
            {Array.from({ length: dayCount }, (_, index) => (
                <col key={index} style={{ width: DAY_COL }} />
            ))}
            <col style={{ width: TOTAL_COL }} />
        </colgroup>
    )
}

function CombinedStandingsHeader({ days }: { days: ChampionshipCombinedStandings["days"] }) {
    return (
        <thead>
            <tr className="text-xs">
                <th>Place</th>
                <th>#</th>
                <th>Name</th>
                <th className="hidden md:table-cell">Club</th>
                {days.map((day) => (
                    <th key={day.dayOrder} className="text-center">
                        D{day.dayOrder}
                    </th>
                ))}
                <th className="text-right">Total</th>
            </tr>
        </thead>
    )
}

function CategoryStandingsCard({
    heading,
    bgColor,
    days,
    competitors,
    tableMinWidth,
}: {
    heading: string
    bgColor: string
    days: ChampionshipCombinedStandings["days"]
    competitors: ChampionshipCombinedStandings["complete"][number]["competitors"]
    tableMinWidth: string
}) {
    return (
        <div className={`${bgColor} rounded-lg p-3`}>
            <h3 className="text-base font-semibold mb-2">{heading}</h3>
            <table
                className="table table-compact table-zebra table-fixed w-full"
                style={{ minWidth: tableMinWidth }}
            >
                <CombinedStandingsColGroup dayCount={days.length} />
                <tbody>
                    {competitors.map((competitor) => (
                        <tr key={competitor.membershipNo}>
                            <td className="font-mono text-sm">{competitor.place ?? "—"}</td>
                            <td className="font-mono text-sm">{competitor.competitorNumber}</td>
                            <td className="truncate">
                                <p className="font-medium text-sm truncate">{competitor.name}</p>
                                <p className="text-xs text-base-content/70 md:hidden truncate">
                                    {competitor.club}
                                </p>
                            </td>
                            <td className="hidden md:table-cell text-sm">{competitor.club}</td>
                            {days.map((day, index) => (
                                <td key={day.dayOrder} className="font-mono text-sm text-center">
                                    {competitor.dayScoreLabels[index] ?? ""}
                                </td>
                            ))}
                            <td className="font-mono text-sm font-semibold text-right">
                                {competitor.totalLabel}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function ChampionshipCombinedStandingsView({
    standings,
}: {
    standings: ChampionshipCombinedStandings
}) {
    const tableMinWidth = combinedStandingsMinWidth(standings.days.length)
    const allGroups = [...standings.inProgress, ...standings.complete]

    return (
        <section className={championshipDetailContentClass}>
            <h2 className="text-lg font-semibold mb-3">Combined standings</h2>
            <p className="text-sm text-base-content/70 mb-4">
                Totals sum completed day scores for enrolled competitors. DNC and DNF days do not add to the total.
            </p>
            {allGroups.length > 0 ? (
                <div className="overflow-x-auto">
                    <div className="space-y-3" style={{ minWidth: tableMinWidth }}>
                        <table
                            className="table table-compact table-fixed w-full"
                            style={{ minWidth: tableMinWidth }}
                        >
                            <CombinedStandingsColGroup dayCount={standings.days.length} />
                            <CombinedStandingsHeader days={standings.days} />
                        </table>
                        {standings.inProgress.map((group) => (
                            <CategoryStandingsCard
                                key={group.categoryKey}
                                heading={group.heading}
                                bgColor="bg-warning/10"
                                days={standings.days}
                                competitors={group.competitors}
                                tableMinWidth={tableMinWidth}
                            />
                        ))}
                        {standings.complete.map((group) => (
                            <CategoryStandingsCard
                                key={group.categoryKey}
                                heading={group.heading}
                                bgColor="bg-success/10"
                                days={standings.days}
                                competitors={group.competitors}
                                tableMinWidth={tableMinWidth}
                            />
                        ))}
                    </div>
                </div>
            ) : null}
            {standings.isEmpty ? (
                <p className="text-sm text-base-content/60">No competitors registered yet.</p>
            ) : null}
        </section>
    )
}
