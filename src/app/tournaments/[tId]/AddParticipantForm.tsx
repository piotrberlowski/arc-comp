"use client"

import ErrorAlert from "@/components/errors/ErrorAlert"
import ParticipantProfileFields from "@/components/participants/ParticipantProfileFields"
import { participantProfileFromParticipant } from "@/lib/participantProfileFields"
import type { ParticipantProfileInput } from "@/lib/participantProfileSchema"
import { Participant } from "@/generated/prisma/browser"
import { CheckCircleIcon, PencilIcon, PlusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"
import Form from "next/form"
import { useActionState, useState } from "react"
import { AddParticipantState, addParticipant } from "./participantActions"

const initialState: AddParticipantState = {
    data: {},
    errors: {},
}

export default function AddParticipantForm({
    tId,
    participant,
    onCancel,
}: {
    tId: string
    participant?: Participant | null
    onCancel?: () => void
}) {
    const participantId = participant?.id

    const [formState, formAction, isPending] = useActionState(addParticipant, initialState, `/tournaments/${tId}`)

    const errorSummary =
        Object.keys(formState.errors).length > 0
            ? Object.values(formState.errors).join(", ")
            : undefined

    const [errorBannerDismissed, setErrorBannerDismissed] = useState(false)
    const visibleError = errorSummary && !errorBannerDismissed ? errorSummary : undefined

    const profileData: Partial<ParticipantProfileInput> = {
        ...participantProfileFromParticipant(participant ?? {}),
        ...formState.data,
    }
    const defaultCheckedIn = participant?.checkedIn ?? formState.data?.checkedIn ?? false

    return (
        <div className="my-2 flex flex-col gap-1">
            {participantId ? (
                <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold">Editing: {participant?.name}</span>
                </div>
            ) : null}
            <Form
                action={formAction}
                className="flex mx-auto gap-1 items-center items-stretch"
                onSubmit={() => {
                    setErrorBannerDismissed(false)
                }}
            >
                <input type="hidden" name="tId" value={tId} />
                <input type="hidden" name="participantId" value={participantId || ""} />
                <ParticipantProfileFields errors={formState.errors ?? {}} data={profileData} layout="inline" />
                <div className="flex-0 flex flex-col gap-1">
                    {participantId ? (
                        <>
                            {onCancel ? (
                                <button type="button" onClick={onCancel} className="btn btn-sm btn-ghost">
                                    <XMarkIcon className="w-4 h-4" />
                                    <span className="hidden md:inline">Cancel</span>
                                </button>
                            ) : null}
                            <button
                                type="submit"
                                name="checkedIn"
                                value={defaultCheckedIn ? "true" : "false"}
                                className="flex-1 min-w-fit btn btn-xs md:btn-sm btn-primary"
                                disabled={isPending}
                            >
                                <PencilIcon className="w-4 h-4" />
                                <span className="hidden md:block">Update</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="submit"
                                name="checkedIn"
                                value="false"
                                className="flex-1 min-w-fit btn btn-xs md:btn-sm btn-secondary"
                                disabled={isPending}
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                <span className="hidden md:block">Preregister</span>
                            </button>
                            <button
                                type="submit"
                                name="checkedIn"
                                value="true"
                                className="flex-1 min-w-fit btn btn-xs md:btn-sm btn-success"
                                disabled={isPending}
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                <span className="hidden md:block">Check&nbsp;In</span>
                            </button>
                        </>
                    )}
                </div>
                <input type="hidden" name="target" value={`/tournaments/[tId]/`} />
            </Form>
            <ErrorAlert error={visibleError} resetAction={() => setErrorBannerDismissed(true)} />
        </div>
    )
}
