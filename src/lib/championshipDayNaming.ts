export type ChampionshipRangeNameRef = {
    rangeNumber: number
    name?: string | null
}

export function normalizeChampionshipRangeName(name: string | null | undefined): string | null {
    const trimmed = name?.trim()
    return trimmed ? trimmed : null
}

export function championshipRangeDisplayName(
    rangeNumber: number,
    name?: string | null
): string {
    return normalizeChampionshipRangeName(name) ?? `Range ${rangeNumber}`
}

export function championshipRangeNamesByNumber(
    rangeConfigs: ChampionshipRangeNameRef[]
): Map<number, string | null> {
    return new Map(
        rangeConfigs.map((row) => [row.rangeNumber, normalizeChampionshipRangeName(row.name)])
    )
}

export function championshipRangeLabels(
    rangeCount: number,
    rangeConfigs: ChampionshipRangeNameRef[] = []
): Record<number, string> {
    const names = championshipRangeNamesByNumber(rangeConfigs)
    const labels: Record<number, string> = {}
    for (let rangeNumber = 1; rangeNumber <= rangeCount; rangeNumber += 1) {
        labels[rangeNumber] = championshipRangeDisplayName(rangeNumber, names.get(rangeNumber))
    }
    return labels
}

export function championshipDayRangeLabel(
    rangeCount: number,
    rangeNumber: number,
    rangeName?: string | null
): string | null {
    if (rangeCount <= 1) {
        return null
    }
    return championshipRangeDisplayName(rangeNumber, rangeName)
}

export function championshipRangeSectionHeading(
    rangeNumber: number,
    tournamentName: string,
    rangeName?: string | null
): string {
    return `${championshipRangeDisplayName(rangeNumber, rangeName)} — ${tournamentName}`
}

export function championshipDayTournamentName(
    championshipName: string,
    dayOrder: number,
    rangeNumber?: number,
    rangeCount?: number,
    rangeName?: string | null
): string {
    const dayLabel = `${championshipName} — Day ${dayOrder}`
    if (rangeCount !== undefined && rangeCount > 1 && rangeNumber !== undefined) {
        return `${dayLabel} ${championshipRangeDisplayName(rangeNumber, rangeName)}`
    }
    return dayLabel
}

export function nextChampionshipDayOrder(rounds: { dayOrder: number }[]): number {
    if (rounds.length === 0) {
        return 1
    }
    return Math.max(...rounds.map((round) => round.dayOrder)) + 1
}

function toDate(value: Date | string): Date {
    return value instanceof Date ? new Date(value) : new Date(value)
}

export function nextChampionshipDayDefaultDate(rounds: { dayOrder: number; date: Date | string }[]): Date {
    if (rounds.length === 0) {
        return new Date()
    }
    const lastDayOrder = Math.max(...rounds.map((round) => round.dayOrder))
    const lastDayRound = rounds.find((round) => round.dayOrder === lastDayOrder)
    if (!lastDayRound) {
        return new Date()
    }
    const next = toDate(lastDayRound.date)
    next.setDate(next.getDate() + 1)
    return next
}
