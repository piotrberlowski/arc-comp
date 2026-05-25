export function championshipDayTournamentName(
    championshipName: string,
    dayOrder: number,
    rangeNumber?: number,
    rangeCount?: number
): string {
    const dayLabel = `${championshipName} — Day ${dayOrder}`
    if (rangeCount !== undefined && rangeCount > 1 && rangeNumber !== undefined) {
        return `${dayLabel} Range ${rangeNumber}`
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
