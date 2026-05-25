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

export type DivisionRangeAssignmentSource = ChampionshipDivisionRangeRow

export function mapDivisionRangeAssignments(
    divisionRanges: DivisionRangeAssignmentSource[]
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
