"use client"

import ParticipantProfileFields from "@/components/participants/ParticipantProfileFields"
import useErrorContext from "@/components/errors/ErrorContext"
import { UserPlusIcon } from "@heroicons/react/24/solid"
import Form from "next/form"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef } from "react"
import { submitRegisterChampionshipCompetitorForm } from "./registerChampionshipCompetitorAction"
import { initialRegisterChampionshipCompetitorFormState } from "./registerChampionshipCompetitorFormState"

export default function RegisterChampionshipCompetitorForm({ championshipId }: { championshipId: string }) {
    const router = useRouter()
    const setError = useErrorContext()
    const [formState, formAction, isPending] = useActionState(
        submitRegisterChampionshipCompetitorForm,
        initialRegisterChampionshipCompetitorFormState
    )
    const handledSuccessRef = useRef(false)
    const errors = formState.errors ?? {}

    useEffect(() => {
        if (!formState.success || handledSuccessRef.current) {
            return
        }
        handledSuccessRef.current = true
        router.refresh()
    }, [formState.success, router])

    useEffect(() => {
        const errorMessages = Object.values(errors)
        if (errorMessages.length === 0) {
            return
        }
        setError(errorMessages.join(", "))
    }, [errors, setError])

    return (
        <div className="card w-full max-w-3xl bg-base-300 card-sm shadow-sm">
            <Form
                action={formAction}
                className="card-body gap-4"
                onSubmit={() => {
                    handledSuccessRef.current = false
                    setError(undefined)
                }}
            >
                <input type="hidden" name="championshipId" value={championshipId} />
                <ParticipantProfileFields errors={errors} data={formState.data} />
                <div className="justify-end card-actions">
                    <button type="submit" className="btn btn-success" disabled={isPending}>
                        <UserPlusIcon width={20} />
                        Register competitor
                    </button>
                </div>
            </Form>
        </div>
    )
}
