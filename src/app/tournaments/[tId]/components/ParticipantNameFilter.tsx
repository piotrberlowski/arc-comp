"use client"

import { useState } from "react"

export function filterByName<T extends { name: string }>(participants: T[], query: string): T[] {
    const needle = query.trim().toLowerCase()
    if (needle.length === 0) {
        return participants
    }
    return participants.filter((participant) => participant.name.toLowerCase().includes(needle))
}

export default function ParticipantNameFilter({
    value,
    onChange,
}: {
    value: string
    onChange: (value: string) => void
}) {
    return (
        <>
            <label className="sr-only" htmlFor="participant-name-filter">
                Filter by name
            </label>
            <input
                id="participant-name-filter"
                type="search"
                className="input input-bordered input-xs md:input-sm md:w-auto"
                placeholder="Filter by name"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </>
    )
}

ParticipantNameFilter.filter = filterByName

export function useParticipantNameFilter() {
    const [query, setQuery] = useState("")
    return {
        control: <ParticipantNameFilter value={query} onChange={setQuery} />,
        filter<T extends { name: string }>(participants: T[]) {
            return filterByName(participants, query)
        },
    }
}
