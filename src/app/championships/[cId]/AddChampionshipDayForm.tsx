"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import TournamentDayPicker from "@/app/tournaments/TournamentDayPicker"
import TournamentSetupForm, { type TournamentSetupFieldErrors } from "@/app/tournaments/TournamentSetupForm"
import { championshipDayTournamentName } from "@/lib/championshipDayNaming"
import { PencilSquareIcon } from "@heroicons/react/24/solid"
import Form from "next/form"
import { useActionState, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { submitAddChampionshipDayForm } from "./addChampionshipDayAction"
import { initialAddChampionshipDayFormState } from "./addChampionshipDayFormState"

export type ChampionshipRangeConfigSummary = {
    rangeNumber: number
    formatName: string
}

function AddDaySubmitButton({ pending }: { pending: boolean }) {
    const { pending: formPending } = useFormStatus()
    return (
        <button type="submit" className="btn btn-success" disabled={pending || formPending}>
            <PencilSquareIcon width={24} />
            Add day!
        </button>
    )
}

function useFormErrorMessages(errors: Record<string, string> | undefined): string | undefined {
    if (!errors) {
        return undefined
    }
    const messages = Object.values(errors).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : undefined
}

export default function AddChampionshipDayForm({
    championshipId,
    championshipName,
    nextDayOrder,
    defaultDate,
    rangeCount,
    rangeConfigs,
    organizerClub,
    onClose,
}: {
    championshipId: string
    championshipName: string
    nextDayOrder: number
    defaultDate: Date
    rangeCount: number
    rangeConfigs: ChampionshipRangeConfigSummary[]
    organizerClub: string
    onClose: () => void
}) {
    const usesStoredRangeFormats = rangeConfigs.length > 0
    const generatedDayName = useMemo(
        () => championshipDayTournamentName(championshipName, nextDayOrder, 1, rangeCount),
        [championshipName, nextDayOrder, rangeCount]
    )
    const router = useRouter()
    const setError = useErrorContext()
    const [date, setDate] = useState(() => new Date(defaultDate))
    const [formState, formAction, isPending] = useActionState(
        submitAddChampionshipDayForm,
        initialAddChampionshipDayFormState,
        `/championships/${championshipId}/add-day`
    )
    const handledSuccessRef = useRef(false)
    const errorMessage = useFormErrorMessages(formState.errors)

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

    if (usesStoredRangeFormats) {
        return (
            <div className="card w-full bg-base-300 card-sm shadow-sm">
                <Form
                    action={formAction}
                    className="card-body gap-4"
                    onSubmit={() => {
                        handledSuccessRef.current = false
                        setError(undefined)
                    }}
                >
                    <input type="hidden" name="championshipId" value={championshipId} />
                    <input type="hidden" name="name" value={generatedDayName} />
                    <input type="hidden" name="date" value={date.toISOString()} />
                    <input type="hidden" name="usesRangeFormats" value="true" />

                    <p className="text-sm text-base-content/70">
                        Each range uses the round type set when the championship was created.
                    </p>
                    <ul className="flex flex-col gap-2">
                        {rangeConfigs.map((rangeConfig) => (
                            <li
                                key={rangeConfig.rangeNumber}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-base-200 px-3 py-2 text-sm"
                            >
                                <span className="font-medium">
                                    {rangeCount > 1 ? `Range ${rangeConfig.rangeNumber}` : "Round type"}
                                </span>
                                <span className="badge badge-info badge-outline">{rangeConfig.formatName}</span>
                            </li>
                        ))}
                    </ul>
                    <div
                        className={`flex justify-between items-center gap-3 p-3 bg-secondary rounded-md ${formState.errors?.date ? "ring-2 ring-error" : ""}`}
                    >
                        <span className="font-medium">Day {nextDayOrder}</span>
                        <TournamentDayPicker
                            date={date}
                            onChange={(selected) => {
                                if (selected) {
                                    setDate(selected)
                                }
                            }}
                        />
                    </div>
                    <div className="justify-end card-actions flex flex-wrap gap-2">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <AddDaySubmitButton pending={isPending} />
                    </div>
                </Form>
            </div>
        )
    }

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
            defaultDate={defaultDate}
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
