"use client"

import { Participant } from "@/generated/prisma/browser"
import { useEffect, useState } from "react"

export type FilterType = "all" | "checked-in" | "non-checked-in"

const FILTER_STORAGE_KEY = "participant-filter-preference"

const CHECK_IN_FILTERS: readonly FilterType[] = ["all", "checked-in", "non-checked-in"]

function isCheckInFilter(value: string): value is FilterType {
    return (CHECK_IN_FILTERS as readonly string[]).includes(value)
}

export function parseCheckInFilter(value: string): FilterType {
    return isCheckInFilter(value) ? value : "all"
}

function getStoredFilter(): FilterType {
    if (typeof window === "undefined") return "all"
    return parseCheckInFilter(localStorage.getItem(FILTER_STORAGE_KEY) ?? "")
}

function setStoredFilter(filter: FilterType): void {
    if (typeof window === "undefined") return
    localStorage.setItem(FILTER_STORAGE_KEY, filter)
}

export function createParticipantFilter(filter: FilterType): (participant: Participant) => boolean {
    if (filter === "checked-in") {
        return (participant) => participant.checkedIn
    }
    if (filter === "non-checked-in") {
        return (participant) => !participant.checkedIn
    }
    return () => true
}

export function useCheckInFilter() {
    const [checkInFilter, setCheckInFilter] = useState<FilterType>("all")

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only hydration of persisted filter preference
        setCheckInFilter(getStoredFilter())
    }, [])

    useEffect(() => {
        setStoredFilter(checkInFilter)
    }, [checkInFilter])

    return { checkInFilter, setCheckInFilter }
}

export default function ParticipantFilter({
    filter,
    onFilterChange,
}: {
    filter: FilterType
    onFilterChange: (filter: FilterType) => void
}) {
    return (
        <select
            className="select select-bordered select-sm w-full sm:w-auto"
            value={filter}
            onChange={(event) => onFilterChange(parseCheckInFilter(event.target.value))}
            aria-label="Filter by check-in status"
        >
            <option value="all">All Participants</option>
            <option value="checked-in">Checked In</option>
            <option value="non-checked-in">Pre-registered</option>
        </select>
    )
}
