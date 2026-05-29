"use client"

import type { ChampionshipCombinedStandings } from "@/lib/championshipCombinedStandings"
import { championshipDetailContentClass } from "./championshipDetailLayout"


function CombinedStandingsHeader({ days }: { days: ChampionshipCombinedStandings["days"] }) {
    return (
        <thead>
            <tr className="text-xs">
                <th className="w-16">Place</th>
                <th className="hidden md:table-cell text-left">#</th>
                <th className="text-left">Name</th>
                <th className="hidden md:table-cell text-left">Club</th>
                {days.map((day) => (
                    <th key={day.dayOrder} className="text-left hidden sm:table-cell w-12">
                        D{day.dayOrder}
                    </th>
                ))}
                <th className="text-left w-16">Total</th>
            </tr>
        </thead>
    )
}

function CategoryStandingsCard({
    heading,
    bgColor,
    days,
    competitors,
}: {
    heading: string
    bgColor: string
    days: ChampionshipCombinedStandings["days"]
    competitors: ChampionshipCombinedStandings["complete"][number]["competitors"]
}) {
    return (
        <div className={`${bgColor} rounded-lg p-3`}>
            <h3 className="text-base font-semibold mb-2">{heading}</h3>
            <table
                className="table table-compact table-zebra table-fixed w-full"
            >
                <tbody>
                    {competitors.map((competitor) => (
                        <tr key={competitor.membershipNo}>
                            <td className="font-mono text-sm w-16">{competitor.place ?? "—"}</td>
                            <td className="font-mono text-sm hidden md:table-cell">{competitor.competitorNumber}</td>
                            <td className="truncate text-left">
                                <p className="font-medium text-sm truncate text-left">{competitor.name}</p>
                                <p className="text-xs text-base-content/70 md:hiddentruncate text-left">
                                    {competitor.club}
                                </p>
                            </td>
                            <td className="hidden md:table-cell text-sm">{competitor.club}</td>
                            {days.map((day, index) => (
                                <td key={day.dayOrder} className="font-mono text-sm hidden sm:table-cell text-left w-12">
                                    {competitor.dayScoreLabels[index] ?? ""}
                                </td>
                            ))}
                            <td className="font-mono text-sm font-semibold text-left w-16">
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
    embedded = false,
}: {
    standings: ChampionshipCombinedStandings
    embedded?: boolean
}) {
    const allGroups = [...standings.inProgress, ...standings.complete]

    return (
        <section className={embedded ? "w-full" : championshipDetailContentClass}>
            {!embedded ? (
                <>
                    <h2 className="text-lg font-semibold mb-3">Combined standings</h2>
                    <p className="text-sm text-base-content/70 mb-4">
                        Totals sum completed day scores for enrolled competitors, including any shootoff values entered
                        on those days. DNC and DNF days do not add to the total.
                    </p>
                </>
            ) : null}
            {allGroups.length > 0 ? (
                <div className="overflow-x-auto">
                    <div className="space-y-3">
                        <div className="rounded-lg p-3">
                            <table
                                className="table table-compact table-fixed w-full"
                            >
                                <CombinedStandingsHeader days={standings.days} />
                            </table>
                        </div>
                        {standings.inProgress.map((group) => (
                            <CategoryStandingsCard
                                key={group.categoryKey}
                                heading={group.heading}
                                bgColor="bg-warning/10"
                                days={standings.days}
                                competitors={group.competitors}
                            />
                        ))}
                        {standings.complete.map((group) => (
                            <CategoryStandingsCard
                                key={group.categoryKey}
                                heading={group.heading}
                                bgColor="bg-success/10"
                                days={standings.days}
                                competitors={group.competitors}
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
