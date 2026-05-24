"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { enrollChampionshipCompetitorsOnDay } from "../championshipActions"
import type { ChampionshipRosterDayColumn } from "./ChampionshipRosterList"

export default function ChampionshipRosterEnrollAllDaysButton({
    championshipId,
    days,
    membershipNos,
    readOnly,
}: {
    championshipId: string
    days: ChampionshipRosterDayColumn[]
    membershipNos: string[]
    readOnly: boolean
}) {
    const router = useRouter()
    const setError = useErrorContext()
    const [isPending, startTransition] = useTransition()

    if (readOnly || days.length === 0 || membershipNos.length === 0) {
        return null
    }

    const handleEnrollAllDays = () => {
        startTransition(async () => {
            try {
                for (const day of days) {
                    await enrollChampionshipCompetitorsOnDay(championshipId, day.dayOrder, membershipNos)
                }
                router.refresh()
            } catch (error) {
                setError(error instanceof Error ? error.message : "Unable to enroll all competitors")
            }
        })
    }

    return (
        <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={isPending}
            onClick={handleEnrollAllDays}
        >
            Enroll all on all days
        </button>
    )
}
