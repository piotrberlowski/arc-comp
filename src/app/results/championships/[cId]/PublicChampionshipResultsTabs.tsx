"use client"

import ChampionshipCombinedStandingsView from "@/app/championships/[cId]/ChampionshipCombinedStandingsView"
import type { ChampionshipCombinedStandings } from "@/lib/championshipCombinedStandings"
import { useState } from "react"
import type { PublicChampionshipTournamentRef, PublicTournamentGroupsData } from "../championshipResultsActions"

const activeTabClass =
    "tab-active bg-primary text-primary-content border-secondary border-solid border-1 border-b-0"

const resultsPanelClass = "rounded-lg border border-base-300 bg-base-100 overflow-hidden"

type ResultsTabId = number | "standings"

function DayGroupCard({
    heading,
    groups,
    unassigned,
}: {
    heading: string
    groups: PublicTournamentGroupsData["groups"]
    unassigned: PublicTournamentGroupsData["unassigned"]
}) {
    return (
        <div className="card bg-base-100 border border-base-300">
            <div className="card-body gap-4">
                <h3 className="card-title text-base">{heading}</h3>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {groups.map((group) => (
                        <div key={group.groupNumber} className="rounded-lg border border-base-300 p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold">Group {group.groupNumber}</p>
                                <p className="text-xs text-base-content/70">{group.participants.length}</p>
                            </div>
                            {group.participants.length === 0 ? (
                                <p className="text-sm text-base-content/60">No assignments yet.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {group.participants.map((participant) => (
                                        <li
                                            key={participant.id}
                                            className="flex items-baseline justify-between gap-3 text-sm"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">
                                                    {participant.competitorNumber ? (
                                                        <span className="font-mono text-xs mr-2">
                                                            #{participant.competitorNumber}
                                                        </span>
                                                    ) : null}
                                                    {participant.name}
                                                    {participant.isCaptain ? (
                                                        <span className="ml-2 badge badge-xs badge-outline">
                                                            Captain
                                                        </span>
                                                    ) : null}
                                                </p>
                                                <p className="truncate text-xs text-base-content/70">
                                                    {participant.club ?? "Independent"}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>

                {unassigned.length > 0 ? (
                    <div className="rounded-lg bg-base-200 p-3">
                        <p className="font-semibold mb-2">Unassigned ({unassigned.length})</p>
                        <ul className="columns-1 md:columns-2 gap-6 space-y-1">
                            {unassigned.map((participant) => (
                                <li key={participant.id} className="text-sm break-inside-avoid">
                                    <span className="font-mono text-xs mr-2">
                                        {participant.competitorNumber ? `#${participant.competitorNumber}` : "—"}
                                    </span>
                                    <span className="font-medium">{participant.name}</span>
                                    <span className="text-xs text-base-content/70">
                                        {" "}
                                        · {participant.club ?? "Independent"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

function DayGroupAllocations({
    dayOrder,
    rounds,
    groupsByTournamentId,
}: {
    dayOrder: number
    rounds: PublicChampionshipTournamentRef[]
    groupsByTournamentId: Record<string, PublicTournamentGroupsData>
}) {
    const dayRounds = rounds.filter((round) => round.dayOrder === dayOrder)

    return (
        <div className="space-y-3">
            {dayRounds.map((round) => {
                const groupsData = groupsByTournamentId[round.tournamentId]
                if (!groupsData) {
                    return null
                }

                return (
                    <DayGroupCard
                        key={round.tournamentId}
                        heading={`Range ${round.rangeNumber} — ${round.tournamentName}`}
                        groups={groupsData.groups}
                        unassigned={groupsData.unassigned}
                    />
                )
            })}
        </div>
    )
}

function StandingsPanel({ standings }: { standings: ChampionshipCombinedStandings | null }) {
    if (standings) {
        return <ChampionshipCombinedStandingsView standings={standings} embedded />
    }

    return <p className="text-sm text-base-content/70">Combined standings are not available yet.</p>
}

export default function PublicChampionshipResultsTabs({
    dayOrders,
    rounds,
    groupsByTournamentId,
    standings,
}: {
    dayOrders: number[]
    rounds: PublicChampionshipTournamentRef[]
    groupsByTournamentId: Record<string, PublicTournamentGroupsData>
    standings: ChampionshipCombinedStandings | null
}) {
    const [activeTab, setActiveTab] = useState<ResultsTabId>(() => dayOrders[0] ?? "standings")

    return (
        <div className={resultsPanelClass}>
            <div
                role="tablist"
                className="tabs tabs-boxed bg-base-200 w-full rounded-none border-b border-base-300"
            >
                {dayOrders.map((dayOrder) => (
                    <button
                        key={dayOrder}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === dayOrder}
                        className={`tab flex-1 min-w-0 ${activeTab === dayOrder ? activeTabClass : "hover:bg-base-300"}`}
                        onClick={() => setActiveTab(dayOrder)}
                    >
                        Day {dayOrder}
                    </button>
                ))}
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "standings"}
                    className={`tab flex-1 min-w-0 ${activeTab === "standings" ? activeTabClass : "hover:bg-base-300"}`}
                    onClick={() => setActiveTab("standings")}
                >
                    Combined standings
                </button>
            </div>
            <div className="p-4" role="tabpanel">
                {activeTab === "standings" ? (
                    <StandingsPanel standings={standings} />
                ) : (
                    <DayGroupAllocations
                        dayOrder={activeTab}
                        rounds={rounds}
                        groupsByTournamentId={groupsByTournamentId}
                    />
                )}
            </div>
        </div>
    )
}
