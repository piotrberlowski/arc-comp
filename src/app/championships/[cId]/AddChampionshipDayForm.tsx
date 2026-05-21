"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import TournamentSetupForm, { type TournamentSetupFieldErrors } from "@/app/tournaments/TournamentSetupForm"
import { championshipDayTournamentName } from "@/lib/championshipDayNaming"
import { useActionState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { submitAddChampionshipDayForm } from "./addChampionshipDayAction"
import { initialAddChampionshipDayFormState } from "./addChampionshipDayFormState"

export default function AddChampionshipDayForm({
    championshipId,
    championshipName,
    nextDayOrder,
    organizerClub,
    onClose,
}: {
    championshipId: string
    championshipName: string
    nextDayOrder: number
    organizerClub: string
    onClose: () => void
}) {
    const generatedDayName = useMemo(
        () => championshipDayTournamentName(championshipName, nextDayOrder),
        [championshipName, nextDayOrder]
    )
    const router = useRouter()
    const setError = useErrorContext()
    const [formState, formAction, isPending] = useActionState(
        submitAddChampionshipDayForm,
        initialAddChampionshipDayFormState
    )
    const handledSuccessRef = useRef(false)
    useEffect(() => {
        if (!formState.success || handledSuccessRef.current) {
            return
        }
        handledSuccessRef.current = true
        onClose()
        router.refresh()
    }, [formState.success, onClose, router])

    useEffect(() => {
        const fieldErrors = formState.errors
        if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
            return
        }
        setError(Object.values(fieldErrors).join(", "))
    }, [formState.errors, setError])

    const fieldErrors: TournamentSetupFieldErrors = {
        formatId: !!formState.errors?.formatId,
        name: !!formState.errors?.name,
        date: !!formState.errors?.date,
        endCount: !!formState.errors?.endCount,
        groupSize: !!formState.errors?.groupSize,
    }

    return (
        <TournamentSetupForm
            club={organizerClub}
            tournamentName={generatedDayName}
            action={formAction}
            onSubmit={() => {
                handledSuccessRef.current = false
                setError(undefined)
            }}
            hiddenFields={<input type="hidden" name="championshipId" value={championshipId} />}
            fieldErrors={fieldErrors}
            submitLabel="Add day!"
            onCancel={onClose}
            pending={isPending}
        />
    )
}
