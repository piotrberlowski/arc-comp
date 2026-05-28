"use client"

import ChampionshipCombinedStandingsView from "@/app/championships/[cId]/ChampionshipCombinedStandingsView"
import type { ChampionshipCombinedStandings } from "@/lib/championshipCombinedStandings"
import { useState } from "react"
import type { PublicChampionshipTournamentRef, PublicTournamentGroupsData } from "../championshipResultsActions"
import PublicGroupCard from "./PublicGroupCard"
import PublicUnassignedParticipants from "./PublicUnassignedParticipants"
import { groupGridColsClassName } from "@/lib/groupGridCols"

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
    const assignedGroups = groups.filter((group) => group.participants.length > 0)

    return (
        <div className="card bg-base-100 border border-base-300">
            <div className="card-body gap-4">
                <h3 className="card-title text-base">{heading}</h3>
                <PublicUnassignedParticipants participants={unassigned} />
                {assignedGroups.length > 0 ? (
                    <div className={`grid ${groupGridColsClassName(assignedGroups.length)} gap-4`}>
                        {assignedGroups.map((group) => (
                            <PublicGroupCard key={group.groupNumber} group={group} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-base-content/60">No group assignments yet.</p>
                )}
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
