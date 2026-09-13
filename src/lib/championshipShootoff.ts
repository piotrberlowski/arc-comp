export const CHAMPIONSHIP_SHOOTOFF_RANGE_NAME = "Shootoff"
export const CHAMPIONSHIP_SHOOTOFF_DAY_LABEL = "Shootoff"
export const CHAMPIONSHIP_SHOOTOFF_STANDINGS_LABEL = "SO"

export function isShootoffRangeNumber(rangeNumber: number, rangeCount: number): boolean {
    return rangeNumber > rangeCount
}

export function regularChampionshipRanges<T extends { rangeNumber: number }>(
    ranges: T[] | undefined,
    rangeCount: number
): T[] {
    return (ranges ?? []).filter((range) => !isShootoffRangeNumber(range.rangeNumber, rangeCount))
}

export function shootoffRangeNumber(
    ranges: { rangeNumber: number }[] | undefined,
    rangeCount: number
): number | null {
    return (ranges ?? []).find((range) => isShootoffRangeNumber(range.rangeNumber, rangeCount))?.rangeNumber ?? null
}

export function championshipHasShootoff(
    ranges: { rangeNumber: number }[] | undefined,
    rangeCount: number
): boolean {
    return shootoffRangeNumber(ranges, rangeCount) !== null
}

export function nextChampionshipRangeNumber(ranges: { rangeNumber: number }[] | undefined): number {
    const list = ranges ?? []
    if (list.length === 0) {
        return 1
    }
    return Math.max(...list.map((range) => range.rangeNumber)) + 1
}

export function isShootoffRound(
    round: { rangeNumber: number },
    rangeCount: number
): boolean {
    return isShootoffRangeNumber(round.rangeNumber, rangeCount)
}

export function isShootoffDayOrder(
    dayOrder: number,
    rounds: { dayOrder: number; rangeNumber: number }[],
    shootoffRange: number | null
): boolean {
    return rounds.some(
        (round) => round.dayOrder === dayOrder && shootoffRange !== null && round.rangeNumber === shootoffRange
    )
}

export function shootoffEnrollmentRangeForDay(
    dayOrder: number,
    rounds: { dayOrder: number; rangeNumber: number }[],
    shootoffRange: number | null
): number | null {
    if (!isShootoffDayOrder(dayOrder, rounds, shootoffRange)) {
        return null
    }
    return shootoffRange
}

export function regularChampionshipDayOrders(
    rounds: { dayOrder: number; rangeNumber: number }[],
    shootoffRange: number | null
): number[] {
    const filtered =
        shootoffRange === null
            ? rounds
            : rounds.filter((round) => round.rangeNumber !== shootoffRange)
    return [...new Set(filtered.map((round) => round.dayOrder))].sort((a, b) => a - b)
}

export function championshipDayTitle(dayOrder: number, isShootoff: boolean): string {
    return isShootoff ? CHAMPIONSHIP_SHOOTOFF_DAY_LABEL : `Day ${dayOrder}`
}

export function championshipStandingsDayLabel(dayOrder: number, isShootoff: boolean): string {
    return isShootoff ? CHAMPIONSHIP_SHOOTOFF_STANDINGS_LABEL : `Day ${dayOrder}`
}

export function championshipShootoffTournamentName(championshipName: string): string {
    return `${championshipName} — ${CHAMPIONSHIP_SHOOTOFF_DAY_LABEL}`
}
