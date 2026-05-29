"use client"

import ChampionshipCombinedStandingsView from "@/app/championships/[cId]/ChampionshipCombinedStandingsView"
import type { ChampionshipCombinedStandings } from "@/lib/championshipCombinedStandings"
import { useState } from "react"
import { buildPublicChampionshipPrintPath } from "@/lib/publicChampionshipUrls"
import { PrinterIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import type { PublicChampionshipTournamentRef, PublicTournamentGroupsData } from "../championshipResultsActions"
import PublicDayGroupAllocations from "./PublicDayGroupAllocations"

const activeTabClass =
    "tab-active bg-primary text-primary-content border-secondary border-solid border-1 border-b-0"

const resultsPanelClass = "rounded-lg border border-base-300 bg-base-100 overflow-hidden"

type ResultsTabId = number | "standings"

function StandingsPanel({ standings }: { standings: ChampionshipCombinedStandings | null }) {
    if (standings) {
        return <ChampionshipCombinedStandingsView standings={standings} embedded />
    }

    return <p className="text-sm text-base-content/70">Combined standings are not available yet.</p>
}

function resolveInitialTab(dayOrders: number[], initialDayOrder?: number): ResultsTabId {
    if (initialDayOrder !== undefined && dayOrders.includes(initialDayOrder)) {
        return initialDayOrder
    }
    return dayOrders[0] ?? "standings"
}

export default function PublicChampionshipResultsTabs({
    championshipId,
    dayOrders,
    rounds,
    groupsByTournamentId,
    standings,
    initialDayOrder,
}: {
    championshipId: string
    dayOrders: number[]
    rounds: PublicChampionshipTournamentRef[]
    groupsByTournamentId: Record<string, PublicTournamentGroupsData>
    standings: ChampionshipCombinedStandings | null
    initialDayOrder?: number
}) {
    const [activeTab, setActiveTab] = useState<ResultsTabId>(() => resolveInitialTab(dayOrders, initialDayOrder))

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
                {typeof activeTab === "number" ? (
                    <div className="flex justify-end mb-3 no-print">
                        <Link
                            href={buildPublicChampionshipPrintPath(championshipId, activeTab)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm gap-1"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            Print groups
                        </Link>
                    </div>
                ) : null}
                {activeTab === "standings" ? (
                    <StandingsPanel standings={standings} />
                ) : (
                    <PublicDayGroupAllocations
                        dayOrder={activeTab}
                        rounds={rounds}
                        groupsByTournamentId={groupsByTournamentId}
                    />
                )}
            </div>
        </div>
    )
}
