"use client"

import ConfirmingButton from "@/components/ConfirmingButton"
import { TrashIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { removeChampionshipDay } from "../championshipActions"

export type ChampionshipRoundRow = {
    id: string
    dayOrder: number
    tournamentId: string
    tournamentName: string
    formatName: string
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
}: {
    championshipId: string
    dayOrder: number
    canRemove: boolean
}) {
    const router = useRouter()

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

export default function ChampionshipRoundsList({
    championshipId,
    rounds,
}: {
    championshipId: string
    rounds: ChampionshipRoundRow[]
}) {
    if (rounds.length === 0) {
        return <p className="text-base-content/70">No tournament days linked yet. Add the first day to begin.</p>
    }

    return (
        <ul className="flex flex-col gap-3 w-full max-w-2xl">
            {rounds.map((round) => (
                <li key={round.id} className="card bg-base-200 shadow-sm">
                    <div className="card-body gap-2 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-col gap-1">
                                <p className="font-medium">{round.tournamentName}</p>
                                <span className="badge badge-sm badge-info badge-outline w-fit">
                                    {round.formatName}
                                </span>
                            </div>
                            <RemoveDayButton
                                championshipId={championshipId}
                                dayOrder={round.dayOrder}
                                canRemove={round.canRemove}
                            />
                        </div>
                        <DayTournamentLinks tournamentId={round.tournamentId} />
                    </div>
                </li>
            ))}
        </ul>
    )
}
