export const PARTICIPANT_SORT_KEYS = ["name", "membershipNo", "bowstyle"] as const

export type ParticipantSortKey = (typeof PARTICIPANT_SORT_KEYS)[number]

export type ParticipantListFields = {
    name: string
    membershipNo: string
    categoryId: string
}

const SORT_CONFIG: Record<ParticipantSortKey, { label: string; field: keyof ParticipantListFields }> = {
    name: { label: "Name", field: "name" },
    membershipNo: { label: "Membership number", field: "membershipNo" },
    bowstyle: { label: "Bowstyle", field: "categoryId" },
}

export const PARTICIPANT_SORT_OPTIONS: { value: ParticipantSortKey; label: string }[] =
    PARTICIPANT_SORT_KEYS.map((value) => ({
        value,
        label: SORT_CONFIG[value].label,
    }))

function isParticipantSortKey(value: string): value is ParticipantSortKey {
    return (PARTICIPANT_SORT_KEYS as readonly string[]).includes(value)
}

export function parseParticipantSortKey(value: string): ParticipantSortKey {
    return isParticipantSortKey(value) ? value : "name"
}

export function matchesParticipantName(name: string, query: string): boolean {
    const needle = query.trim().toLowerCase()
    if (needle.length === 0) {
        return true
    }
    return name.toLowerCase().includes(needle)
}

function compareText(left: string, right: string): number {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
}

function sortValue(participant: ParticipantListFields, sortKey: ParticipantSortKey): string {
    return participant[SORT_CONFIG[sortKey].field]
}

export function compareParticipantListOrder(
    left: ParticipantListFields,
    right: ParticipantListFields,
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

export function filterParticipantsByName<T extends { name: string }>(
    participants: T[],
    nameQuery: string
): T[] {
    return participants.filter((participant) => matchesParticipantName(participant.name, nameQuery))
}

export function filterGroupedParticipantsByName<T extends { participants: U[] }, U extends { name: string }>(
    groups: T[],
    nameQuery: string
): (T & { assignedCount: number })[] {
    return groups.map((group) => ({
        ...group,
        assignedCount: group.participants.length,
        participants: filterParticipantsByName(group.participants, nameQuery),
    }))
}

export function applyParticipantListView<T extends ParticipantListFields>(
    participants: T[],
    nameQuery: string,
    sortKey: ParticipantSortKey
): T[] {
    return filterParticipantsByName(participants, nameQuery).sort((left, right) =>
        compareParticipantListOrder(left, right, sortKey)
    )
}
