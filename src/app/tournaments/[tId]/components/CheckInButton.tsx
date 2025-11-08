"use client"

import { CheckCircleIcon, MinusCircleIcon } from "@heroicons/react/24/outline"
import { Participant } from "@prisma/client"
import { useTransition } from "react"
import { checkInParticipant, uncheckParticipant } from "../participantActions"

interface CheckInButtonProps {
    participant: Participant
    onUpdate: () => void
    disabled?: boolean
}

export default function CheckInButton({ participant, onUpdate, disabled = false }: CheckInButtonProps) {
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        startTransition(async () => {
            try {
                if (participant.checkedIn) {
                    await uncheckParticipant(participant.id)
                } else {
                    await checkInParticipant(participant.id)
                }
                onUpdate()
            } catch (error) {
                console.error('Failed to toggle check-in status:', error)
            }
        })
    }

    if (participant.checkedIn) {
        return (
            <button
                className="btn btn-info btn-sm"
                disabled={isPending || disabled}
                onClick={handleToggle}
            >
                <MinusCircleIcon className="w-4 h-4" />
                <span className="hidden md:block">Uncheck</span>
            </button>
        )
    }

    return (
        <button
            className="btn btn-success btn-sm"
            disabled={isPending || disabled}
            onClick={handleToggle}
        >
            <CheckCircleIcon className="w-4 h-4" />
            <span className="hidden md:block">Check In</span>
        </button>
    )
}

