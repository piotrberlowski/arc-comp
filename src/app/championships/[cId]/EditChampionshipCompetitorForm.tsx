"use client"

import ParticipantProfileFields from "@/components/participants/ParticipantProfileFields"
import useErrorContext from "@/components/errors/ErrorContext"
import { PencilIcon } from "@heroicons/react/24/solid"
import Form from "next/form"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef } from "react"
import { participantProfileFromParticipant } from "@/lib/participantProfileFields"
import type { ChampionshipRegistrationRow } from "./ChampionshipRosterList"
import { submitEditChampionshipCompetitorForm } from "./editChampionshipCompetitorAction"
import { initialEditChampionshipCompetitorFormState } from "./editChampionshipCompetitorFormState"
import { championshipDetailContentClass } from "./championshipDetailLayout"

export default function EditChampionshipCompetitorForm({
    championshipId,
    registration,
    onClose,
}: {
    championshipId: string
    registration: ChampionshipRegistrationRow
    onClose: () => void
}) {
    const router = useRouter()
    const setError = useErrorContext()
    const [formState, formAction, isPending] = useActionState(
        submitEditChampionshipCompetitorForm,
        initialEditChampionshipCompetitorFormState
    )
    const handledSuccessRef = useRef(false)
    const errors = formState.errors ?? {}

    useEffect(() => {
        if (!formState.success || handledSuccessRef.current) {
            return
        }
        handledSuccessRef.current = true
        onClose()
        router.refresh()
    }, [formState.success, onClose, router])

    useEffect(() => {
        const errorMessages = Object.values(errors)
        if (errorMessages.length === 0) {
            return
        }
        setError(errorMessages.join(", "))
    }, [errors, setError])

    const formData = formState.data ?? participantProfileFromParticipant(registration)

    return (
        <div className={`card bg-base-300 card-sm shadow-sm ${championshipDetailContentClass}`}>
            <Form
                action={formAction}
                className="card-body gap-4"
                onSubmit={() => {
                    handledSuccessRef.current = false
                    setError(undefined)
                }}
            >
                <h3 className="font-medium">Edit competitor #{registration.competitorNumber}</h3>
                <input type="hidden" name="championshipId" value={championshipId} />
                <input type="hidden" name="registrationId" value={registration.id} />
                <ParticipantProfileFields errors={errors} data={formData} />
                <div className="justify-end card-actions gap-2">
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        <PencilIcon width={20} />
                        Save changes
                    </button>
                </div>
            </Form>
        </div>
    )
}
