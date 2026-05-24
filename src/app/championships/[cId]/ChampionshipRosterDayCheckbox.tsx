"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import {
    enrollChampionshipCompetitorsOnDay,
    unenrollChampionshipCompetitorFromDay,
} from "../championshipActions"

export default function ChampionshipRosterDayCheckbox({
    championshipId,
    dayOrder,
    membershipNo,
    isEnrolled,
    readOnly,
}: {
    championshipId: string
    dayOrder: number
    membershipNo: string
    isEnrolled: boolean
    readOnly: boolean
}) {
    const router = useRouter()
    const setError = useErrorContext()
    const [isPending, startTransition] = useTransition()

    const handleToggle = (checked: boolean) => {
        startTransition(() => {
            const action = checked
                ? enrollChampionshipCompetitorsOnDay(championshipId, dayOrder, [membershipNo])
                : unenrollChampionshipCompetitorFromDay(championshipId, dayOrder, membershipNo)

            action
                .then(() => router.refresh())
                .catch((error) => {
                    setError(error instanceof Error ? error.message : "Unable to update day enrollment")
                })
        })
    }

    return (
        <input
            type="checkbox"
            className="checkbox checkbox-xs"
            checked={isEnrolled}
            disabled={readOnly || isPending}
            aria-label={`Day ${dayOrder}`}
            title={`Day ${dayOrder}`}
            onChange={(event) => handleToggle(event.target.checked)}
        />
    )
}
