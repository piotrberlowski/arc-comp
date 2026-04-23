"use client"

import { EllipsisVerticalIcon } from "@heroicons/react/24/outline"
import { useEffect, useRef, useState } from "react"
import { ParticipantResult } from "@/lib/scoreUtils"
import { useScoreActions } from "../scores/ScoreActionsContext"

interface ScoreInputProps {
    participantId: string
    currentResult: ParticipantResult | null
}

export default function ScoreInput({
    participantId,
    currentResult,
}: ScoreInputProps) {
    const { setScore: onSetScore, clear: onClear, setDNF: onDNF, setDNC: onDNC } = useScoreActions()
    const isSpecialResult = currentResult?.status === 'DNF' || currentResult?.status === 'DNC'

    const [score, setScore] = useState(currentResult?.score?.toString() || '')
    const [isPending, setIsPending] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleBlur = async () => {
        if (isPending || isSpecialResult) return

        const scoreValue = score === '' ? null : parseInt(score)
        const currentValue = currentResult?.score ?? null

        if (scoreValue !== currentValue) {
            setIsPending(true)
            try {
                if (scoreValue === null) {
                    await onClear(participantId)
                } else {
                    await onSetScore(participantId, scoreValue)
                }
            } finally {
                setIsPending(false)
            }
        }
    }

    const handleScoreChange = (value: string) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 4)
        setScore(numericValue)
    }

    const handleAction = async (action: 'CLEAR' | 'DNF' | 'DNC') => {
        if (isPending) return

        setMenuOpen(false)
        setIsPending(true)
        try {
            setScore('')
            if (action === 'CLEAR') await onClear(participantId)
            else if (action === 'DNF') await onDNF(participantId)
            else await onDNC(participantId)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex items-center gap-1">
            {isSpecialResult ? (
                <span className="badge badge-warning badge-sm w-16 justify-center">
                    {currentResult?.status}
                </span>
            ) : (
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
            )}

            {isPending && (
                <span className="text-xs text-base-content/70">...</span>
            )}

            <div className="relative" ref={menuRef}>
                <button
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={() => setMenuOpen(!menuOpen)}
                    disabled={isPending}
                    aria-label="Score actions"
                >
                    <EllipsisVerticalIcon className="w-4 h-4" />
                </button>

                {menuOpen && (
                    <ul className="menu bg-base-200 rounded-box absolute right-0 top-full z-50 w-32 shadow-lg">
                        <li>
                            <button onClick={() => handleAction('CLEAR')}>
                                Clear
                            </button>
                        </li>
                        <li>
                            <button onClick={() => handleAction('DNF')}>
                                DNF
                            </button>
                        </li>
                        <li>
                            <button onClick={() => handleAction('DNC')}>
                                DNC
                            </button>
                        </li>
                    </ul>
                )}
            </div>
        </div>
    )
}

