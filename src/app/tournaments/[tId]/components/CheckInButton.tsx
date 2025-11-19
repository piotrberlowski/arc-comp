"use client"

import { CheckCircleIcon, MinusCircleIcon } from "@heroicons/react/24/outline"
import { Participant } from "@prisma/client"
import { useTransition } from "react"
import { checkInParticipant, uncheckParticipant } from "../participantActions"

export default function CheckInButton({ 
    participant, 
    onUpdate, 
    disabled = false, 
    compact = false 
}: {
    participant: Participant
    onUpdate?: () => void
    disabled?: boolean
    compact?: boolean
}) {
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        startTransition(async () => {
            try {
                if (participant.checkedIn) {
                    await uncheckParticipant(participant.id)
                } else {
                    await checkInParticipant(participant.id)
                }
                onUpdate?.()
            } catch (error) {
                console.error('Failed to toggle check-in status:', error)
            }
        })
    }

    if (participant.checkedIn) {
        return (
            <button
                className={compact ? "btn btn-info btn-xs" : "btn btn-info btn-sm"}
                disabled={isPending || disabled}
                onClick={handleToggle}
            >
                <MinusCircleIcon className={compact ? "w-3 h-3" : "w-4 h-4"} />
                {!compact && <span className="hidden md:block">Uncheck</span>}
            </button>
        )
    }

    return (
        <button
            className={compact ? "btn btn-success btn-xs" : "btn btn-success btn-sm"}
            disabled={isPending || disabled}
            onClick={handleToggle}
        >
            <CheckCircleIcon className={compact ? "w-3 h-3" : "w-4 h-4"} />
            {!compact && <span className="hidden md:block">Check In</span>}
        </button>
    )
}

