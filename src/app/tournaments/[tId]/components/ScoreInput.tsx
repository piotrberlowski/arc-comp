"use client"

import { useState } from "react"

interface ScoreInputProps {
    currentScore: number | null
    isComplete: boolean
    onScoreChange: (score: number | null, isComplete: boolean) => void
}

export default function ScoreInput({
    currentScore,
    isComplete,
    onScoreChange
}: ScoreInputProps) {
    const [score, setScore] = useState(currentScore?.toString() || '')
    const [isPending, setIsPending] = useState(false)

    // Save on blur (lose focus)
    const handleBlur = async () => {
        if (isPending) return

        const scoreValue = score === '' ? null : parseInt(score)
        const shouldBeComplete = scoreValue !== null && scoreValue > 0

        // Only save if the value has actually changed
        if (scoreValue !== currentScore || shouldBeComplete !== isComplete) {
            setIsPending(true)
            try {
                await onScoreChange(scoreValue, shouldBeComplete)
            } finally {
                setIsPending(false)
            }
        }
    }

    const handleScoreChange = (value: string) => {
        // Only allow digits and limit to 4 digits
        const numericValue = value.replace(/\D/g, '').slice(0, 4)
        setScore(numericValue)
    }

    const handleClear = async () => {
        if (isPending) return

        setIsPending(true)
        try {
            setScore('')
            await onScoreChange(null, false)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <input
                    type="text"
                    className="input input-bordered input-sm w-16 text-center"
                    value={score}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="0"
                    maxLength={4}
                    disabled={isPending}
                />
                {isPending && (
                    <span className="text-xs text-base-content/70">Saving...</span>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    className="btn btn-error btn-sm"
                    onClick={handleClear}
                    disabled={isPending}
                >
                    Clear
                </button>
            </div>
        </div>
    )
}

