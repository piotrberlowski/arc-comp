"use client"

import { TiebreakerGroup } from "@/lib/scoreUtils"
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline"
import { useState } from "react"

interface TiebreakersSectionProps {
    tiebreakers: TiebreakerGroup[]
    onShootoffChange: (participantId: string, shootoff: number) => Promise<void>
}

function normalizeShootoffInput(value: string): string {
    return value.replace(/\D/g, "").slice(0, 3)
}

function shouldSubmitShootoff(
    value: string | undefined,
    currentShootoff: number | null,
    isPending: boolean
): boolean {
    if (isPending) return false
    if (!value && currentShootoff === null) return false
    if (value === currentShootoff?.toString()) return false
    return true
}

function getShootoffToSubmit(value: string | undefined): number {
    // Explicit behavior: empty input is interpreted as 0.
    return parseInt(value || "0")
}

function TiebreakerStatus({
    allResolved,
    resolvedCount,
    unresolvedCount,
}: {
    allResolved: boolean
    resolvedCount: number
    unresolvedCount: number
}) {
    if (allResolved) {
        return (
            <>
                <CheckCircleIcon className="w-5 h-5 text-success" />
                <span>All Ties Resolved</span>
                <span className="badge badge-success badge-sm">{resolvedCount}</span>
            </>
        )
    }

    return (
        <>
            <span className="badge badge-warning">{unresolvedCount}</span>
            <span>Tiebreakers Required</span>
            {resolvedCount > 0 && (
                <span className="text-sm text-base-content/70">
                    ({resolvedCount} resolved)
                </span>
            )}
        </>
    )
}

function TiebreakerParticipantRow({
    participantId,
    name,
    score,
    shootoff,
    inputValue,
    isPending,
    onChange,
    onBlur,
}: {
    participantId: string
    name: string
    score: number
    shootoff: number | null
    inputValue: string
    isPending: boolean
    onChange: (participantId: string, value: string) => void
    onBlur: (participantId: string, currentShootoff: number | null) => Promise<void>
}) {
    const inputId = `shootoff-${participantId}`
    const hasShootoff = shootoff !== null

    return (
        <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded ${
                hasShootoff ? "bg-success/10" : "bg-base-200"
            }`}
        >
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{name}</p>
                <p className="text-xs text-base-content/70">
                    Score: {score}
                    {hasShootoff && ` (${shootoff})`}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor={inputId} className="text-xs text-base-content/70">
                    Shootoff:
                </label>
                <input
                    id={inputId}
                    type="text"
                    className={`input input-bordered input-sm w-16 text-center ${
                        hasShootoff ? "input-success" : ""
                    }`}
                    value={inputValue}
                    onChange={(e) => onChange(participantId, e.target.value)}
                    onBlur={() => onBlur(participantId, shootoff)}
                    placeholder="0"
                    maxLength={3}
                    disabled={isPending}
                />
                {isPending && (
                    <span className="loading loading-spinner loading-xs"></span>
                )}
                {!isPending && hasShootoff && (
                    <CheckCircleIcon className="w-4 h-4 text-success" />
                )}
            </div>
        </div>
    )
}

function TiebreakerGroupCard({
    group,
    shootoffs,
    pending,
    onChange,
    onBlur,
}: {
    group: TiebreakerGroup
    shootoffs: Record<string, string>
    pending: Record<string, boolean>
    onChange: (participantId: string, value: string) => void
    onBlur: (participantId: string, currentShootoff: number | null) => Promise<void>
}) {
    return (
        <div
            className={`rounded-lg p-3 ${group.isResolved ? "bg-success/20" : "bg-base-100"}`}
        >
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-base-content/70">
                    {group.category} - {group.ageGender} (Score: {group.score})
                </h4>
                {group.isResolved && (
                    <CheckCircleIcon className="w-4 h-4 text-success" />
                )}
            </div>
            <div className="space-y-2">
                {group.participants.map((p) => (
                    <TiebreakerParticipantRow
                        key={p.participantId}
                        participantId={p.participantId}
                        name={p.name}
                        score={p.score}
                        shootoff={p.shootoff}
                        inputValue={shootoffs[p.participantId] ?? p.shootoff?.toString() ?? ""}
                        isPending={!!pending[p.participantId]}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                ))}
            </div>
        </div>
    )
}

export default function TiebreakersSection({ tiebreakers, onShootoffChange }: TiebreakersSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [shootoffs, setShootoffs] = useState<Record<string, string>>({})
    const [pending, setPending] = useState<Record<string, boolean>>({})

    const unresolvedCount = tiebreakers.filter(g => !g.isResolved).length
    const resolvedCount = tiebreakers.filter(g => g.isResolved).length
    const allResolved = unresolvedCount === 0

    const handleChange = (participantId: string, value: string) => {
        const normalizedValue = normalizeShootoffInput(value)
        setShootoffs(prev => ({ ...prev, [participantId]: normalizedValue }))
    }

    const handleBlur = async (participantId: string, currentShootoff: number | null) => {
        const value = shootoffs[participantId]
        if (!shouldSubmitShootoff(value, currentShootoff, !!pending[participantId])) return

        setPending(prev => ({ ...prev, [participantId]: true }))
        try {
            await onShootoffChange(participantId, getShootoffToSubmit(value))
        } finally {
            setPending(prev => ({ ...prev, [participantId]: false }))
        }
    }

    const bgColor = allResolved ? 'bg-success/10' : 'bg-warning/10'

    return (
        <div className={`${bgColor} rounded-lg p-4`}>
            <button
                className="flex items-center justify-between w-full"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TiebreakerStatus
                        allResolved={allResolved}
                        resolvedCount={resolvedCount}
                        unresolvedCount={unresolvedCount}
                    />
                </h3>
                {isExpanded ? (
                    <ChevronUpIcon className="w-5 h-5" />
                ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                )}
            </button>

            {isExpanded && (
                <div className="mt-4 space-y-4">
                    {tiebreakers.map(group => (
                        <TiebreakerGroupCard
                            key={group.groupKey} 
                            group={group}
                            shootoffs={shootoffs}
                            pending={pending}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
