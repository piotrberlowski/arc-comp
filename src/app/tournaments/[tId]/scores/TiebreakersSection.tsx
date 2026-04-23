"use client"

import { TiebreakerGroup } from "@/lib/scoreUtils"
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline"
import { useState } from "react"

interface TiebreakersSectionProps {
    tiebreakers: TiebreakerGroup[]
    onShootoffChange: (participantId: string, shootoff: number) => Promise<void>
}

export default function TiebreakersSection({ tiebreakers, onShootoffChange }: TiebreakersSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [shootoffs, setShootoffs] = useState<Record<string, string>>({})
    const [pending, setPending] = useState<Record<string, boolean>>({})

    const unresolvedCount = tiebreakers.filter(g => !g.isResolved).length
    const resolvedCount = tiebreakers.filter(g => g.isResolved).length
    const allResolved = unresolvedCount === 0

    const handleChange = (participantId: string, value: string) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 3)
        setShootoffs(prev => ({ ...prev, [participantId]: numericValue }))
    }

    const handleBlur = async (participantId: string, currentShootoff: number | null) => {
        const value = shootoffs[participantId]
        if (pending[participantId]) return
        if (!value && currentShootoff === null) return
        if (value === currentShootoff?.toString()) return

        setPending(prev => ({ ...prev, [participantId]: true }))
        try {
            await onShootoffChange(participantId, parseInt(value || '0'))
        } finally {
            setPending(prev => ({ ...prev, [participantId]: false }))
        }
    }

    const bgColor = allResolved ? 'bg-success/10' : 'bg-warning/10'
    const badgeColor = allResolved ? 'badge-success' : 'badge-warning'

    return (
        <div className={`${bgColor} rounded-lg p-4`}>
            <button
                className="flex items-center justify-between w-full"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    {allResolved ? (
                        <>
                            <CheckCircleIcon className="w-5 h-5 text-success" />
                            <span>All Ties Resolved</span>
                            <span className="badge badge-success badge-sm">{resolvedCount}</span>
                        </>
                    ) : (
                        <>
                            <span className={`badge ${badgeColor}`}>{unresolvedCount}</span>
                            <span>Tiebreakers Required</span>
                            {resolvedCount > 0 && (
                                <span className="text-sm text-base-content/70">
                                    ({resolvedCount} resolved)
                                </span>
                            )}
                        </>
                    )}
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
                        <div 
                            key={group.groupKey} 
                            className={`rounded-lg p-3 ${group.isResolved ? 'bg-success/20' : 'bg-base-100'}`}
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
                                {group.participants.map(p => (
                                    <div
                                        key={p.participantId}
                                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded ${
                                            p.shootoff !== null ? 'bg-success/10' : 'bg-base-200'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {p.name}
                                            </p>
                                            <p className="text-xs text-base-content/70">
                                                Score: {p.score}
                                                {p.shootoff !== null && ` (${p.shootoff})`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-base-content/70">
                                                Shootoff:
                                            </label>
                                            <input
                                                type="text"
                                                className={`input input-bordered input-sm w-16 text-center ${
                                                    p.shootoff !== null ? 'input-success' : ''
                                                }`}
                                                value={shootoffs[p.participantId] ?? p.shootoff?.toString() ?? ''}
                                                onChange={(e) => handleChange(p.participantId, e.target.value)}
                                                onBlur={() => handleBlur(p.participantId, p.shootoff)}
                                                placeholder="0"
                                                maxLength={3}
                                                disabled={pending[p.participantId]}
                                            />
                                            {pending[p.participantId] && (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            )}
                                            {!pending[p.participantId] && p.shootoff !== null && (
                                                <CheckCircleIcon className="w-4 h-4 text-success" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
