"use client"

import type { ReactNode } from "react"
import {
    PARTICIPANT_SORT_OPTIONS,
    parseParticipantSortKey,
    type ParticipantSortKey,
} from "@/lib/participantListView"

export default function ParticipantViewControls({
    nameQuery,
    onNameQueryChange,
    sortKey,
    onSortChange,
    children,
}: {
    nameQuery: string
    onNameQueryChange: (query: string) => void
    sortKey: ParticipantSortKey
    onSortChange: (sortKey: ParticipantSortKey) => void
    children?: ReactNode
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <label className="sr-only" htmlFor="participant-name-filter">
                Filter by name
            </label>
            <input
                id="participant-name-filter"
                type="search"
                className="input input-bordered input-sm w-full sm:max-w-xs"
                placeholder="Filter by name"
                value={nameQuery}
                onChange={(event) => onNameQueryChange(event.target.value)}
            />
            <label className="sr-only" htmlFor="participant-sort">
                Sort by
            </label>
            <select
                id="participant-sort"
                className="select select-bordered select-sm w-full sm:w-auto"
                value={sortKey}
                onChange={(event) => onSortChange(parseParticipantSortKey(event.target.value))}
            >
                {PARTICIPANT_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        Sort: {option.label}
                    </option>
                ))}
            </select>
            {children}
        </div>
    )
}
