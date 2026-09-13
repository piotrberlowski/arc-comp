"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import TournamentSetupForm, { type TournamentSetupFieldErrors } from "@/app/tournaments/TournamentSetupForm"
import { championshipShootoffTournamentName } from "@/lib/championshipShootoff"
import { useActionState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { submitAddChampionshipShootoffForm } from "./addChampionshipShootoffAction"
import { initialAddChampionshipDayFormState } from "./addChampionshipDayFormState"

function formErrorMessage(errors: Record<string, string> | undefined): string | undefined {
    if (!errors) {
        return undefined
    }
    const messages = Object.values(errors).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : undefined
}

export default function AddChampionshipShootoffForm({
    championshipId,
    championshipName,
    defaultDate,
    organizerClub,
    onClose,
}: {
    championshipId: string
    championshipName: string
    defaultDate: Date
    organizerClub: string
    onClose: () => void
}) {
    const generatedName = useMemo(
        () => championshipShootoffTournamentName(championshipName),
        [championshipName]
    )
    const router = useRouter()
    const setError = useErrorContext()
    const [formState, formAction, isPending] = useActionState(
        submitAddChampionshipShootoffForm,
        initialAddChampionshipDayFormState,
        `/championships/${championshipId}/add-shootoff`
    )
    const handledSuccessRef = useRef(false)
    const errorMessage = formErrorMessage(formState.errors)

    useEffect(() => {
        if (!formState.success || handledSuccessRef.current) {
            return
        }
        handledSuccessRef.current = true
        onClose()
        router.refresh()
    }, [formState.success, onClose, router])

    useEffect(() => {
        if (!errorMessage) {
            return
        }
        setError(errorMessage)
    }, [errorMessage, setError])

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
            tournamentName={generatedName}
            defaultDate={defaultDate}
            action={formAction}
            onSubmit={() => {
                handledSuccessRef.current = false
                setError(undefined)
            }}
            hiddenFields={<input type="hidden" name="championshipId" value={championshipId} />}
            fieldErrors={fieldErrors}
            submitLabel="Add shootoff"
            onCancel={onClose}
            pending={isPending}
        />
    )
}
