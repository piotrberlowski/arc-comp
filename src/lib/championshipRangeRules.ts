export type ChampionshipRoundWithScoreCount = {
    dayOrder: number
    rangeNumber: number
    tournament: { _count: { participantScores: number } }
}

export type ChampionshipDivisionRangeRow = {
    dayOrder: number
    ageGroupId: string
    categoryId: string
    genderGroup: string
    rangeNumber: number
}

export function mapDivisionRangeAssignments(
    divisionRanges: ChampionshipDivisionRangeRow[]
): ChampionshipDivisionRangeRow[] {
    return divisionRanges.map((row) => ({
        dayOrder: row.dayOrder,
        ageGroupId: row.ageGroupId,
        categoryId: row.categoryId,
        genderGroup: row.genderGroup,
        rangeNumber: row.rangeNumber,
    }))
}

export function isDayOneRangeAssignmentFrozen(rounds: ChampionshipRoundWithScoreCount[]): boolean {
    return rounds
        .filter((round) => round.dayOrder === 1)
        .some((round) => round.tournament._count.participantScores > 0)
}

export function findDivisionRangeAssignment(
    assignments: ChampionshipDivisionRangeRow[],
    dayOrder: number,
    ageGroupId: string,
    categoryId: string,
    genderGroup: string
): number | null {
    const row = assignments.find(
        (assignment) =>
            assignment.dayOrder === dayOrder &&
            assignment.ageGroupId === ageGroupId &&
            assignment.categoryId === categoryId &&
            assignment.genderGroup === genderGroup
    )
    return row?.rangeNumber ?? null
}

export function findDivisionRangeOnOtherDay(
    assignments: ChampionshipDivisionRangeRow[],
    dayOrder: number,
    ageGroupId: string,
    categoryId: string,
    genderGroup: string,
    rangeNumber: number
): number | null {
    const row = assignments.find(
        (assignment) =>
            assignment.dayOrder !== dayOrder &&
            assignment.ageGroupId === ageGroupId &&
            assignment.categoryId === categoryId &&
            assignment.genderGroup === genderGroup &&
            assignment.rangeNumber === rangeNumber
    )
    return row?.dayOrder ?? null
}

export function isDivisionRangeBlockedOnOtherDay(
    rangeByDay: Record<number, number | null>,
    dayOrder: number,
    rangeNumber: number
): boolean {
    return Object.entries(rangeByDay).some(
        ([otherDay, otherRange]) => Number(otherDay) !== dayOrder && otherRange === rangeNumber
    )
}

export function availableRangesForDay(
    rangeByDay: Record<number, number | null>,
    dayOrder: number,
    rangeCount: number
): number[] {
    const ranges: number[] = []
    for (let rangeNumber = 1; rangeNumber <= rangeCount; rangeNumber += 1) {
        if (!isDivisionRangeBlockedOnOtherDay(rangeByDay, dayOrder, rangeNumber)) {
            ranges.push(rangeNumber)
        }
    }
    return ranges
}

export function soleAvailableRangeForDay(
    rangeByDay: Record<number, number | null>,
    dayOrder: number,
    rangeCount: number
): number | null {
    if (rangeByDay[dayOrder] != null) {
        return null
    }

    const available = availableRangesForDay(rangeByDay, dayOrder, rangeCount)
    return available.length === 1 ? available[0]! : null
}

export type SoleAvailableRangeAssignment = {
    divisionKey: string
    dayOrder: number
    rangeNumber: number
}

export function isMatrixRowInAutoFillScope<
    T extends { divisionKey: string; categoryId: string },
>(row: T, scope: T[]): boolean {
    if (scope.length === 0) {
        return false
    }

    if (scope.length === 1) {
        return row.divisionKey === scope[0]!.divisionKey
    }

    return row.categoryId === scope[0]!.categoryId
}

export function matrixRowsForAutoFillAfterAssign<
    T extends { divisionKey: string; categoryId: string },
>(rows: T[], assignments: RangeAssignmentUpdate[]): T[] {
    const assigning = assignments.filter((assignment) => assignment.rangeNumber !== null)
    if (assigning.length === 0) {
        return []
    }

    const touchedDivisionKeys = new Set(assigning.map((assignment) => assignment.divisionKey))
    if (touchedDivisionKeys.size === 1) {
        const divisionKey = [...touchedDivisionKeys][0]!
        return rows.filter((row) => row.divisionKey === divisionKey)
    }

    const touchedRows = rows.filter((row) => touchedDivisionKeys.has(row.divisionKey))
    const categoryIds = new Set(touchedRows.map((row) => row.categoryId))
    if (categoryIds.size === 1) {
        const categoryId = [...categoryIds][0]!
        return rows.filter((row) => row.categoryId === categoryId)
    }

    return []
}

export function collectSoleAvailableRangeAssignments(
    rows: { divisionKey: string; rangeByDay: Record<number, number | null> }[],
    dayOrders: number[],
    rangeCount: number,
    dayOneFrozen: boolean
): SoleAvailableRangeAssignment[] {
    const assignments: SoleAvailableRangeAssignment[] = []

    for (const row of rows) {
        for (const dayOrder of dayOrders) {
            if (dayOneFrozen && dayOrder === 1) {
                continue
            }

            const rangeNumber = soleAvailableRangeForDay(row.rangeByDay, dayOrder, rangeCount)
            if (rangeNumber !== null) {
                assignments.push({ divisionKey: row.divisionKey, dayOrder, rangeNumber })
            }
        }
    }

    return assignments
}

export function isDayRangeAssignmentEditable(dayOrder: number, dayOneFrozen: boolean): boolean {
    return !(dayOneFrozen && dayOrder === 1)
}

export function shouldApplyRangeOnDay(
    rangeByDay: Record<number, number | null>,
    dayOrder: number,
    rangeNumber: number | null,
    dayOneFrozen: boolean
): boolean {
    if (!isDayRangeAssignmentEditable(dayOrder, dayOneFrozen)) {
        return false
    }

    const current = rangeByDay[dayOrder] ?? null
    if (rangeNumber === null) {
        return current !== null
    }

    if (current === rangeNumber) {
        return false
    }

    return !isDivisionRangeBlockedOnOtherDay(rangeByDay, dayOrder, rangeNumber)
}

export type RangeAssignmentUpdate = {
    divisionKey: string
    dayOrder: number
    rangeNumber: number | null
}

export function buildCategoryRangeUpdates(
    rows: { divisionKey: string; rangeByDay: Record<number, number | null> }[],
    dayOrders: number[],
    dayOrder: number | "all",
    rangeNumber: number | null,
    dayOneFrozen: boolean
): RangeAssignmentUpdate[] {
    const targetDays = dayOrder === "all" ? dayOrders : [dayOrder]
    const updates: RangeAssignmentUpdate[] = []

    for (const row of rows) {
        for (const targetDay of targetDays) {
            if (shouldApplyRangeOnDay(row.rangeByDay, targetDay, rangeNumber, dayOneFrozen)) {
                updates.push({
                    divisionKey: row.divisionKey,
                    dayOrder: targetDay,
                    rangeNumber,
                })
            }
        }
    }

    return updates
}

export function categoryHasAssignmentOnFrozenDayOne(
    rows: { rangeByDay: Record<number, number | null> }[],
    dayOneFrozen: boolean
): boolean {
    if (!dayOneFrozen) {
        return false
    }

    return rows.some((row) => row.rangeByDay[1] != null)
}

export function resolveDivisionRangeForDay(
    assignments: ChampionshipDivisionRangeRow[],
    rangeCount: number,
    dayOrder: number,
    ageGroupId: string,
    categoryId: string,
    genderGroup: string
): number | null {
    const assignedRange = findDivisionRangeAssignment(
        assignments,
        dayOrder,
        ageGroupId,
        categoryId,
        genderGroup
    )
    if (assignedRange !== null) {
        return assignedRange
    }
    if (rangeCount <= 1) {
        return 1
    }
    return null
}

export function canEnrollDivisionOnDay(
    assignments: ChampionshipDivisionRangeRow[],
    rangeCount: number,
    dayOrder: number,
    ageGroupId: string,
    categoryId: string,
    genderGroup: string
): boolean {
    return resolveDivisionRangeForDay(
        assignments,
        rangeCount,
        dayOrder,
        ageGroupId,
        categoryId,
        genderGroup
    ) !== null
}

type DivisionKeyParts = {
    ageGroupId: string
    categoryId: string
    genderGroup: string
}

export function isDivisionRangeAssignmentComplete(
    divisions: DivisionKeyParts[],
    dayOrders: number[],
    assignments: ChampionshipDivisionRangeRow[],
    rangeCount: number
): boolean {
    if (rangeCount <= 1 || dayOrders.length === 0 || divisions.length === 0) {
        return true
    }

    return divisions.every((division) =>
        dayOrders.every(
            (dayOrder) =>
                findDivisionRangeAssignment(
                    assignments,
                    dayOrder,
                    division.ageGroupId,
                    division.categoryId,
                    division.genderGroup
                ) !== null
        )
    )
}
