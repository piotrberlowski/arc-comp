"use client"

import ConfirmingButton from "@/components/ConfirmingButton"
import { TrashIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { removeChampionshipDay } from "../championshipActions"
import ChampionshipDayAutoSeedButton from "./ChampionshipDayAutoSeedButton"
import ChampionshipDayGroupsPrintLink from "./ChampionshipDayGroupsPrintLink"
import { championshipDetailContentClass } from "./championshipDetailLayout"

export type ChampionshipRoundRow = {
    id: string
    dayOrder: number
    rangeNumber: number
    tournamentId: string
    tournamentName: string
    tournamentDate: Date
    formatName: string
    endCount: number
    groupSize: number
    canRemove: boolean
}

function DayTournamentLinks({ tournamentId }: { tournamentId: string }) {
    const base = `/tournaments/${tournamentId}`
    return (
        <div className="flex flex-wrap gap-2">
            <Link href={base} className="btn btn-xs btn-primary">
                Overview
            </Link>
            <Link href={`${base}/groups`} className="btn btn-xs btn-outline">
                Groups
            </Link>
            <Link href={`${base}/scores`} className="btn btn-xs btn-outline">
                Scores
            </Link>
        </div>
    )
}

function RemoveDayButton({
    championshipId,
    dayOrder,
    canRemove,
    readOnly,
}: {
    championshipId: string
    dayOrder: number
    canRemove: boolean
    readOnly: boolean
}) {
    const router = useRouter()

    if (readOnly) {
        return null
    }
    if (!canRemove) {
        return <span className="text-xs text-base-content/50">Scores entered — cannot remove</span>
    }

    return (
        <ConfirmingButton
            className="inline"
            action={() => removeChampionshipDay(championshipId, dayOrder).then(() => router.refresh())}
            baseButton={{
                className: "btn-error btn-xs",
                children: (
                    <>
                        <TrashIcon width={16} />
                        Remove
                    </>
                ),
            }}
            confirmButton={{
                className: "btn-warning btn-xs",
                children: <>Confirm remove</>,
            }}
        />
    )
}

function groupRoundsByDay(rounds: ChampionshipRoundRow[]) {
    const byDay = new Map<number, ChampionshipRoundRow[]>()

    for (const round of rounds) {
        const dayRounds = byDay.get(round.dayOrder) ?? []
        dayRounds.push(round)
        byDay.set(round.dayOrder, dayRounds)
    }

    return [...byDay.entries()]
        .sort(([dayA], [dayB]) => dayA - dayB)
        .map(([dayOrder, dayRounds]) => ({
            dayOrder,
            rounds: [...dayRounds].sort((a, b) => a.rangeNumber - b.rangeNumber),
        }))
}

function DayRangeRow({
    round,
    championshipId,
    readOnly,
}: {
    round: ChampionshipRoundRow
    championshipId: string
    readOnly: boolean
}) {
    return (
        <li className="flex flex-col gap-2 border-t border-base-300 pt-3 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm">{round.tournamentName}</p>
                <span className="badge badge-sm badge-info badge-outline">{round.formatName}</span>
                {round.rangeNumber > 1 ? (
                    <span className="badge badge-sm badge-ghost">Range {round.rangeNumber}</span>
                ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <DayTournamentLinks tournamentId={round.tournamentId} />
                {!readOnly && round.dayOrder >= 2 ? (
                    <ChampionshipDayAutoSeedButton
                        championshipId={championshipId}
                        dayOrder={round.dayOrder}
                        rangeNumber={round.rangeNumber}
                        endCount={round.endCount}
                        groupSize={round.groupSize}
                    />
                ) : null}
            </div>
        </li>
    )
}

export default function ChampionshipRoundsList({
    championshipId,
    rounds,
    readOnly = false,
}: {
    championshipId: string
    rounds: ChampionshipRoundRow[]
    readOnly?: boolean
}) {
    const days = useMemo(() => groupRoundsByDay(rounds), [rounds])

    if (rounds.length === 0) {
        return (
            <p className={`text-base-content/70 ${championshipDetailContentClass}`}>
                No tournament days linked yet. Add the first day to begin.
            </p>
        )
    }

    return (
        <ul className={`flex flex-col gap-4 ${championshipDetailContentClass}`}>
            {days.map(({ dayOrder, rounds: dayRounds }) => (
                <li key={dayOrder} className="card bg-base-200 shadow-sm w-full">
                    <div className="card-body gap-3 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="font-medium">Day {dayOrder}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {!readOnly ? (
                                    <ChampionshipDayGroupsPrintLink
                                        championshipId={championshipId}
                                        dayOrder={dayOrder}
                                    />
                                ) : null}
                                <RemoveDayButton
                                    championshipId={championshipId}
                                    dayOrder={dayOrder}
                                    canRemove={dayRounds[0]?.canRemove ?? false}
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                        <ul className="flex flex-col gap-0">
                            {dayRounds.map((round) => (
                                <DayRangeRow
                                    key={round.id}
                                    round={round}
                                    championshipId={championshipId}
                                    readOnly={readOnly}
                                />
                            ))}
                        </ul>
                    </div>
                </li>
            ))}
        </ul>
    )
}
