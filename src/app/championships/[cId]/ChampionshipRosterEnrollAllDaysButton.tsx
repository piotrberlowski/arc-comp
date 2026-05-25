"use client"

import useErrorContext, { useInfoContext } from "@/components/errors/ErrorContext"
import { formatEnrollAllDaysMessage } from "@/lib/championshipEnrollmentMessages"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { enrollAllChampionshipCompetitorsOnAssignedDays } from "../championshipActions"

export default function ChampionshipRosterEnrollAllDaysButton({
    championshipId,
    membershipNos,
    assignmentsComplete,
    readOnly,
}: {
    championshipId: string
    membershipNos: string[]
    assignmentsComplete: boolean
    readOnly: boolean
}) {
    const router = useRouter()
    const setError = useErrorContext()
    const setInfo = useInfoContext()
    const [isPending, startTransition] = useTransition()

    if (readOnly || membershipNos.length === 0) {
        return null
    }

    const handleEnrollAllDays = () => {
        startTransition(() => {
            enrollAllChampionshipCompetitorsOnAssignedDays(championshipId, membershipNos)
                .then((result) => {
                    setError(undefined)
                    setInfo(formatEnrollAllDaysMessage(result))
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
            className="btn btn-outline btn-sm"
            disabled={isPending || !assignmentsComplete}
            title={
                assignmentsComplete
                    ? "Enroll all competitors on every day using range assignments"
                    : "Complete division–range assignments on every day first"
            }
            onClick={handleEnrollAllDays}
        >
            Enroll all on all days
        </button>
    )
}
