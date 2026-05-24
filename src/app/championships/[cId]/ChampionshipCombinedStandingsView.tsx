"use client"

import type { ChampionshipCombinedStandings } from "@/lib/championshipCombinedStandings"
import { championshipDetailContentClass } from "./championshipDetailLayout"

function CategoryStandingsTable({
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
        <div className={`${bgColor} rounded-lg p-3 mb-3`}>
            <h3 className="text-base font-semibold mb-2">{heading}</h3>
            <div className="overflow-x-auto">
                <table className="table table-compact table-zebra w-full">
                    <thead>
                        <tr>
                            <th className="w-12">Place</th>
                            <th className="w-12">#</th>
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
                    <tbody>
                        {competitors.map((competitor) => (
                            <tr key={competitor.membershipNo}>
                                <td className="font-mono text-sm">{competitor.place ?? "—"}</td>
                                <td className="font-mono text-sm">{competitor.competitorNumber}</td>
                                <td>
                                    <p className="font-medium text-sm">{competitor.name}</p>
                                    <p className="text-xs text-base-content/70 md:hidden">{competitor.club}</p>
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
        </div>
    )
}

export default function ChampionshipCombinedStandingsView({
    standings,
}: {
    standings: ChampionshipCombinedStandings
}) {
    return (
        <section className={championshipDetailContentClass}>
            <h2 className="text-lg font-semibold mb-3">Combined standings</h2>
            <p className="text-sm text-base-content/70 mb-4">
                Totals sum completed day scores for enrolled competitors. DNC and DNF days do not add to the total.
            </p>
            {standings.inProgress.map((group) => (
                <CategoryStandingsTable
                    key={group.categoryKey}
                    heading={group.heading}
                    bgColor="bg-warning/10"
                    days={standings.days}
                    competitors={group.competitors}
                />
            ))}
            {standings.complete.map((group) => (
                <CategoryStandingsTable
                    key={group.categoryKey}
                    heading={group.heading}
                    bgColor="bg-success/10"
                    days={standings.days}
                    competitors={group.competitors}
                />
            ))}
            {standings.isEmpty ? (
                <p className="text-sm text-base-content/60">No competitors registered yet.</p>
            ) : null}
        </section>
    )
}
