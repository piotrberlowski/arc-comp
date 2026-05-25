"use client"

import useErrorContext, { useInfoContext } from "@/components/errors/ErrorContext"
import { formatDayEnrollAllMessage } from "@/lib/championshipEnrollmentMessages"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { enrollChampionshipCompetitorsOnDay } from "../championshipActions"

export default function ChampionshipRosterDayEnrollAllButton({
    championshipId,
    dayOrder,
    membershipNos,
    readOnly,
}: {
    championshipId: string
    dayOrder: number
    membershipNos: string[]
    readOnly: boolean
}) {
    const router = useRouter()
    const setError = useErrorContext()
    const setInfo = useInfoContext()
    const [isPending, startTransition] = useTransition()

    if (readOnly || membershipNos.length === 0) {
        return null
    }

    const handleEnrollAll = () => {
        startTransition(() => {
            enrollChampionshipCompetitorsOnDay(championshipId, dayOrder, membershipNos)
                .then((result) => {
                    setError(undefined)
                    setInfo(formatDayEnrollAllMessage(result, dayOrder))
                    router.refresh()
                })
                .catch((error) => {
                    setInfo(undefined)
                    setError(error instanceof Error ? error.message : "Unable to enroll all competitors")
                })
        })
    }

    return (
        <button
            type="button"
            className="btn btn-primary btn-xs px-1 min-h-0 h-auto font-normal"
            disabled={isPending}
            title={`Enroll assigned competitors on day ${dayOrder}`}
            onClick={handleEnrollAll}
        >
            All
        </button>
    )
}
