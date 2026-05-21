"use client"

import TournamentDayPicker from "@/app/tournaments/TournamentDayPicker"
import RoundFormatSelect from "@/components/RoundFormatSelect"
import { PencilSquareIcon } from "@heroicons/react/24/solid"
import Form from "next/form"
import type { ComponentProps, ReactNode } from "react"
import { useState } from "react"
import { useFormStatus } from "react-dom"

export type TournamentSetupFieldErrors = Partial<
    Record<"formatId" | "name" | "date" | "endCount" | "groupSize", boolean>
>

function numberInputClass(hasError: boolean): string {
    return hasError ? "input input-bordered w-full input-error" : "input input-bordered w-full"
}

function TournamentSetupSubmitButton({
    label,
    pending,
}: {
    label: ReactNode
    pending?: boolean
}) {
    const { pending: formPending } = useFormStatus()
    return (
        <button type="submit" className="btn btn-success" disabled={pending ?? formPending}>
            {label}
        </button>
    )
}

type TournamentSetupFormProps = {
    action: ComponentProps<typeof Form>["action"]
    onSubmit?: ComponentProps<typeof Form>["onSubmit"]
    hiddenFields?: ReactNode
    fieldErrors?: TournamentSetupFieldErrors
    submitLabel: ReactNode
    onCancel?: () => void
    pending?: boolean
} & (
        | { club: string; clubs: string[]; onClubChange: (club: string) => void }
        | { club: string }
    ) &
    (
        | { tournamentName: string }
        | { tournamentName?: never }
    )

export default function TournamentSetupForm({
    club,
    tournamentName,
    action,
    onSubmit,
    hiddenFields,
    fieldErrors = {},
    submitLabel,
    onCancel,
    pending = false,
    ...clubProps
}: TournamentSetupFormProps) {
    const [formatId, setFormatId] = useState("")
    const [date, setDate] = useState(new Date())
    const [endCount, setEndCount] = useState(28)
    const [groupSize, setGroupSize] = useState(4)
    const [internalName, setInternalName] = useState("")
    const clubOptions = "clubs" in clubProps ? clubProps.clubs : [club]
    const clubDisabled = !("clubs" in clubProps)
    const nameReadOnly = tournamentName !== undefined
    const displayName = nameReadOnly ? tournamentName : internalName

    return (
        <div className="card w-full bg-base-300 card-sm shadow-sm">
            <select
                className="select select-primary w-full bg-base-200"
                value={club}
                disabled={clubDisabled}
                aria-readonly={clubDisabled || undefined}
                onChange={
                    "onClubChange" in clubProps
                        ? (evt) => clubProps.onClubChange(evt.target.value)
                        : undefined
                }
            >
                {clubOptions.map((c) => (
                    <option key={`club-select-${c}`} value={c}>
                        {c}
                    </option>
                ))}
            </select>
            <Form action={action} className="card-body" onSubmit={onSubmit}>
                {hiddenFields}
                {nameReadOnly ? <input type="hidden" name="name" value={tournamentName} /> : null}
                <input type="hidden" name="formatId" value={formatId} />
                <input type="hidden" name="date" value={date.toISOString()} />

                <span className="badge badge-info text-lg py-6">
                    Format:{" "}
                    <RoundFormatSelect
                        className={`select-sm select-primary text-primary-content ${fieldErrors.formatId ? "select-error" : ""}`}
                        formatId={formatId}
                        onChange={(format) => {
                            if (format) {
                                setFormatId(format.id)
                                setEndCount(format.endCount)
                                setGroupSize(format.groupSize)
                            }
                        }}
                    />
                </span>
                <div
                    className={`flex justify-between items-center gap-3 p-3 bg-secondary rounded-md ${fieldErrors.date ? "ring-2 ring-error" : ""}`}
                >
                    <input
                        type="text"
                        name={nameReadOnly ? undefined : "name"}
                        readOnly={nameReadOnly}
                        placeholder={nameReadOnly ? undefined : "Tournament name"}
                        className={`card-title input input-primary flex-1 ${fieldErrors.name ? "input-error" : ""}`}
                        value={displayName}
                        onChange={nameReadOnly ? undefined : (evt) => setInternalName(evt.target.value)}
                        required={!nameReadOnly}
                        aria-label={nameReadOnly ? "Generated tournament name" : undefined}
                    />
                    <span className="text-xl shrink-0">
                        <TournamentDayPicker date={date} onChange={setDate} />
                    </span>
                </div>
                <div className="flex gap-4 p-3 bg-base-200 rounded-md">
                    <div className="flex-1">
                        <label className="label">
                            <span className="label-text">End Count</span>
                        </label>
                        <input
                            type="number"
                            name="endCount"
                            className={numberInputClass(!!fieldErrors.endCount)}
                            min={1}
                            value={endCount}
                            onChange={(evt) => setEndCount(Number(evt.target.value))}
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="label">
                            <span className="label-text">Group Size</span>
                        </label>
                        <input
                            type="number"
                            name="groupSize"
                            className={numberInputClass(!!fieldErrors.groupSize)}
                            min={2}
                            value={groupSize}
                            onChange={(evt) => setGroupSize(Number(evt.target.value))}
                            required
                        />
                    </div>
                </div>
                <div className="justify-end card-actions flex flex-wrap gap-2">
                    {onCancel ? (
                        <button type="button" className="btn btn-ghost" onClick={onCancel}>
                            Cancel
                        </button>
                    ) : null}
                    <TournamentSetupSubmitButton
                        pending={pending}
                        label={
                            <>
                                <PencilSquareIcon width={24} />
                                {submitLabel}
                            </>
                        }
                    />
                </div>
            </Form>
        </div>
    )
}
