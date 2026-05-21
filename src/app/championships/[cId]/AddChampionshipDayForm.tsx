"use client"

import RoundFormatSelect from "@/components/RoundFormatSelect"
import ErrorAlert from "@/components/errors/ErrorAlert"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import Form from "next/form"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef, useState } from "react"
import TournamentDayPicker from "@/app/tournaments/TournamentDayPicker"
import { submitAddChampionshipDayForm } from "./addChampionshipDayAction"
import { initialAddChampionshipDayFormState } from "./addChampionshipDayFormState"

function inputClass(hasError: boolean): string {
    return hasError ? "input input-bordered w-full input-error" : "input input-bordered w-full"
}

export default function AddChampionshipDayForm({
    championshipId,
    organizerClub,
    onClose,
}: {
    championshipId: string
    organizerClub: string
    onClose: () => void
}) {
    const router = useRouter()
    const [formState, formAction, isPending] = useActionState(
        submitAddChampionshipDayForm,
        initialAddChampionshipDayFormState
    )
    const handledSuccessRef = useRef(false)
    const errors = formState.errors ?? {}
    const formData = formState.data ?? {}

    const [formatId, setFormatId] = useState(formData.formatId ?? "")
    const [date, setDate] = useState(formData.date ?? new Date())
    const [endCount, setEndCount] = useState(formData.endCount ?? 28)
    const [groupSize, setGroupSize] = useState(formData.groupSize ?? 4)
    const [errorBannerDismissed, setErrorBannerDismissed] = useState(false)

    useEffect(() => {
        if (!formState.success || handledSuccessRef.current) {
            return
        }
        handledSuccessRef.current = true
        onClose()
        router.refresh()
    }, [formState.success, onClose, router])

    const errorSummary =
        Object.keys(errors).length > 0 ? Object.values(errors).join(", ") : undefined
    const visibleError = errorSummary && !errorBannerDismissed ? errorSummary : undefined

    return (
        <div className="card w-full bg-base-300 shadow-sm">
            <Form
                action={formAction}
                className="card-body gap-3"
                onSubmit={() => {
                    handledSuccessRef.current = false
                    setErrorBannerDismissed(false)
                }}
            >
                <input type="hidden" name="championshipId" value={championshipId} />
                <input type="hidden" name="formatId" value={formatId} />
                <input type="hidden" name="date" value={date.toISOString()} />

                <span className="badge badge-info badge-outline w-fit">{organizerClub}</span>
                <label className="flex flex-col gap-1 w-fit">
                    <span className="text-sm">Format</span>
                    <RoundFormatSelect
                        className={`select-sm select-accent text-primary-content ${errors.formatId ? "select-error" : ""}`}
                        formatId={formatId}
                        onChange={(format) => {
                            if (format) {
                                setFormatId(format.id)
                                setEndCount(format.endCount)
                                setGroupSize(format.groupSize)
                            }
                        }}
                    />
                </label>
                <div className={errors.date ? "rounded-md ring-2 ring-error" : ""}>
                    <TournamentDayPicker date={date} onChange={setDate} />
                </div>
                <div className="flex gap-4">
                    <label className="form-control flex-1">
                        <span className="label-text">End count</span>
                        <input
                            type="number"
                            name="endCount"
                            className={inputClass(!!errors.endCount)}
                            min={1}
                            value={endCount}
                            onChange={(evt) => setEndCount(Number(evt.target.value))}
                        />
                    </label>
                    <label className="form-control flex-1">
                        <span className="label-text">Group size</span>
                        <input
                            type="number"
                            name="groupSize"
                            className={inputClass(!!errors.groupSize)}
                            min={2}
                            value={groupSize}
                            onChange={(evt) => setGroupSize(Number(evt.target.value))}
                        />
                    </label>
                </div>
                <ErrorAlert error={visibleError} resetAction={() => setErrorBannerDismissed(true)} />
                <div className="card-actions justify-end gap-2">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-success" disabled={isPending}>
                        <PlusCircleIcon width={20} />
                        Add day
                    </button>
                </div>
            </Form>
        </div>
    )
}
