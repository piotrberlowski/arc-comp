"use client"

import { useSyncExternalStore } from "react"

export const CHECK_IN_FILTERS = ["all", "checked-in", "non-checked-in"] as const

export type CheckInFilter = (typeof CHECK_IN_FILTERS)[number]

const FILTER_STORAGE_KEY = "participant-filter-preference"

function isCheckInFilter(value: string): value is CheckInFilter {
    return (CHECK_IN_FILTERS as readonly string[]).includes(value)
}

export function parseCheckInFilter(value: string): CheckInFilter {
    return isCheckInFilter(value) ? value : "all"
}

function getStoredFilter(): CheckInFilter {
    if (typeof window === "undefined") {
        return "all"
    }
    return parseCheckInFilter(localStorage.getItem(FILTER_STORAGE_KEY) ?? "")
}

function getServerCheckInFilter(): CheckInFilter {
    return "all"
}

const checkInListeners = new Set<() => void>()

function subscribeCheckInFilter(onStoreChange: () => void) {
    checkInListeners.add(onStoreChange)
    window.addEventListener("storage", onStoreChange)
    return () => {
        checkInListeners.delete(onStoreChange)
        window.removeEventListener("storage", onStoreChange)
    }
}

function persistCheckInFilter(next: CheckInFilter) {
    localStorage.setItem(FILTER_STORAGE_KEY, next)
    checkInListeners.forEach((listener) => listener())
}

export function filterByCheckIn<T extends { checkedIn: boolean }>(
    participants: T[],
    filter: CheckInFilter
): T[] {
    if (filter === "checked-in") {
        return participants.filter((participant) => participant.checkedIn)
    }
    if (filter === "non-checked-in") {
        return participants.filter((participant) => !participant.checkedIn)
    }
    return participants
}

export default function ParticipantCheckinFilter({
    value,
    onChange,
}: {
    value: CheckInFilter
    onChange: (value: CheckInFilter) => void
}) {
    return (
        <select
            className="select select-bordered select-sm w-full sm:w-auto"
            value={value}
            onChange={(event) => onChange(parseCheckInFilter(event.target.value))}
            aria-label="Filter by check-in status"
        >
            <option value="all">All Participants</option>
            <option value="checked-in">Checked In</option>
            <option value="non-checked-in">Pre-registered</option>
        </select>
    )
}

ParticipantCheckinFilter.filter = filterByCheckIn

export function useParticipantCheckinFilter() {
    const value = useSyncExternalStore(subscribeCheckInFilter, getStoredFilter, getServerCheckInFilter)
    return {
        control: <ParticipantCheckinFilter value={value} onChange={persistCheckInFilter} />,
        filter<T extends { checkedIn: boolean }>(participants: T[]) {
            return filterByCheckIn(participants, value)
        },
    }
}
