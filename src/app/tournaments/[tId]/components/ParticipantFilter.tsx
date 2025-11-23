"use client"

import { Participant } from "@/generated/prisma/browser"
import { useEffect, useMemo, useState } from "react"

export type FilterType = 'all' | 'checked-in' | 'non-checked-in'

const FILTER_STORAGE_KEY = 'participant-filter-preference'

function getStoredFilter(): FilterType {
    if (typeof window === 'undefined') return 'all'
    const stored = localStorage.getItem(FILTER_STORAGE_KEY)
    if (stored === 'checked-in' || stored === 'non-checked-in' || stored === 'all') {
        return stored
    }
    return 'all'
}

function setStoredFilter(filter: FilterType): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(FILTER_STORAGE_KEY, filter)
}

export function createParticipantFilter(filter: FilterType): (participant: Participant) => boolean {
    switch (filter) {
        case 'checked-in':
            return (participant) => participant.checkedIn
        case 'non-checked-in':
            return (participant) => !participant.checkedIn
        case 'all':
        default:
            return () => true
    }
}

interface ParticipantFilterProps {
    participants: Participant[]
    onFilteredChange: (filteredParticipants: Participant[]) => void
}

export default function ParticipantFilter({
    participants,
    onFilteredChange
}: ParticipantFilterProps) {
    const [filter, setFilter] = useState<FilterType>('all')

    // Load filter from localStorage on mount
    useEffect(() => {
        const storedFilter = getStoredFilter()
        setFilter(storedFilter)
    }, [])

    // Save filter to localStorage whenever it changes
    useEffect(() => {
        setStoredFilter(filter)
    }, [filter])

    // Filter participants using the filter function
    const filterFn = useMemo(() => createParticipantFilter(filter), [filter])
    const filteredParticipants = useMemo(() => {
        return participants.filter(filterFn)
    }, [participants, filterFn])

    // Notify parent of filtered results whenever they change
    useEffect(() => {
        onFilteredChange(filteredParticipants)
    }, [filteredParticipants, onFilteredChange])

    const handleFilterChange = (newFilter: FilterType) => {
        setFilter(newFilter)
    }

    return (
        <div className="flex items-center gap-4">
            <select
                className="select select-bordered select-sm flex-grow"
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value as FilterType)}
            >
                <option value="all">All Participants</option>
                <option value="checked-in">Checked In</option>
                <option value="non-checked-in">Pre-registered</option>
            </select>
            <span className="text-sm text-base-content/70 hidden md:block">
                Showing {filteredParticipants.length} of {participants.length} participants
            </span>
        </div>
    )
}

