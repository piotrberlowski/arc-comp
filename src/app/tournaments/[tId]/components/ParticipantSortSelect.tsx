"use client"

import { participantDivisionAbbrev } from "@/lib/participantProfileFields"
import { useState } from "react"

export const PARTICIPANT_SORT_KEYS = ["name", "club", "category", "membershipNo"] as const

export type ParticipantSortKey = (typeof PARTICIPANT_SORT_KEYS)[number]

export type ParticipantSortFields = {
    name: string
    membershipNo: string
    club: string | null
    ageGroupId: string
    genderGroup: string
    categoryId: string
}

export const PARTICIPANT_SORT_OPTIONS: { value: ParticipantSortKey; label: string }[] = [
    { value: "name", label: "Name" },
    { value: "club", label: "Club" },
    { value: "category", label: "Category" },
    { value: "membershipNo", label: "Membership No." },
]

function isParticipantSortKey(value: string): value is ParticipantSortKey {
    return (PARTICIPANT_SORT_KEYS as readonly string[]).includes(value)
}

export function parseParticipantSortKey(value: string): ParticipantSortKey {
    return isParticipantSortKey(value) ? value : "name"
}

function compareText(left: string, right: string): number {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
}

function sortValue(participant: ParticipantSortFields, sortKey: ParticipantSortKey): string {
    if (sortKey === "club") {
        return participant.club?.trim() ?? ""
    }
    if (sortKey === "category") {
        return participantDivisionAbbrev(participant)
    }
    if (sortKey === "membershipNo") {
        return participant.membershipNo.trim()
    }
    return participant.name.trim()
}

export function compareParticipants(
    left: ParticipantSortFields,
    right: ParticipantSortFields,
    sortKey: ParticipantSortKey
): number {
    const primary = compareText(sortValue(left, sortKey), sortValue(right, sortKey))
    if (primary !== 0) {
        return primary
    }
    const byName = compareText(left.name, right.name)
    if (byName !== 0) {
        return byName
    }
    return compareText(left.membershipNo, right.membershipNo)
}

export function sortParticipants<T extends ParticipantSortFields>(
    participants: T[],
    sortKey: ParticipantSortKey
): T[] {
    return [...participants].sort((left, right) => compareParticipants(left, right, sortKey))
}

export default function ParticipantSortSelect({
    value,
    onChange,
}: {
    value: ParticipantSortKey
    onChange: (value: ParticipantSortKey) => void
}) {
    return (
        <>
            <label className="sr-only" htmlFor="participant-sort">
                Sort by
            </label>
            <select
                id="participant-sort"
                className="hidden md:block select select-bordered select-xs md:select-sm max-w-max"
                value={value}
                onChange={(event) => onChange(parseParticipantSortKey(event.target.value))}
            >
                {PARTICIPANT_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        Sort: {option.label}
                    </option>
                ))}
            </select>
        </>
    )
}

ParticipantSortSelect.sort = sortParticipants

export function useParticipantSortSelect() {
    const [sortKey, setSortKey] = useState<ParticipantSortKey>("name")
    return {
        control: <ParticipantSortSelect value={sortKey} onChange={setSortKey} />,
        sort<T extends ParticipantSortFields>(participants: T[]) {
            return sortParticipants(participants, sortKey)
        },
    }
}
