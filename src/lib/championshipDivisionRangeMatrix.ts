import type { GenderGroup } from "@/generated/prisma/client"
import {
    compareDivisionsForMatrix,
    championshipDivisionKey,
    type ChampionshipDivision,
} from "@/lib/championshipDivision"
import { computeDivisionRangeTotalsByDay } from "@/lib/divisionRangeMatrixTotals"
import {
    isDayOneRangeAssignmentFrozen,
    mapDivisionRangeAssignments,
    type ChampionshipDivisionRangeRow,
    type ChampionshipRoundWithScoreCount,
} from "@/lib/championshipRangeRules"
import { participantDivisionAbbrev } from "@/lib/participantProfileFields"

export type DivisionRangeMatrixRow = {
    divisionKey: string
    ageGroupId: string
    categoryId: string
    categoryName: string
    ageGroupName: string
    genderGroup: string
    abbrev: string
    registrationCount: number
    rangeByDay: Record<number, number | null>
    isCub: boolean
}

export type DivisionRangeMatrixData = {
    dayOrders: number[]
    rangeCount: number
    dayOneFrozen: boolean
    rows: DivisionRangeMatrixRow[]
    totalsByDay: Record<number, Record<number, number>>
}

type ChampionshipRegistrationForMatrix = {
    ageGroupId: string
    categoryId: string
    genderGroup: GenderGroup
    ageGroup: { name: string }
    category: { name: string }
}

export type ChampionshipShellForDivisionRangeMatrix = {
    rangeCount: number
    rounds: ChampionshipRoundWithScoreCount[]
    registrations: ChampionshipRegistrationForMatrix[]
    divisionRanges: ChampionshipDivisionRangeRow[]
}

type DivisionWithCount = ChampionshipDivision & { registrationCount: number }

function buildDivisionsWithRegistrationCounts(
    registrations: ChampionshipRegistrationForMatrix[]
): DivisionWithCount[] {
    const byKey = new Map<string, DivisionWithCount>()

    for (const registration of registrations) {
        const key = championshipDivisionKey(
            registration.ageGroupId,
            registration.genderGroup,
            registration.categoryId
        )
        const existing = byKey.get(key)
        if (existing) {
            existing.registrationCount += 1
            continue
        }
        byKey.set(key, {
            ageGroupId: registration.ageGroupId,
            categoryId: registration.categoryId,
            genderGroup: registration.genderGroup,
            ageGroupName: registration.ageGroup.name,
            categoryName: registration.category.name,
            registrationCount: 1,
        })
    }

    return [...byKey.values()].sort(compareDivisionsForMatrix)
}

function buildAssignmentLookup(assignments: ChampionshipDivisionRangeRow[]): Map<string, number> {
    const lookup = new Map<string, number>()
    for (const assignment of assignments) {
        lookup.set(
            `${assignment.dayOrder}:${assignment.ageGroupId}:${assignment.categoryId}:${assignment.genderGroup}`,
            assignment.rangeNumber
        )
    }
    return lookup
}

function lookupDivisionRangeAssignment(
    lookup: Map<string, number>,
    dayOrder: number,
    ageGroupId: string,
    categoryId: string,
    genderGroup: string
): number | null {
    return lookup.get(`${dayOrder}:${ageGroupId}:${categoryId}:${genderGroup}`) ?? null
}

export function buildDivisionRangeMatrixFromShell(
    championship: ChampionshipShellForDivisionRangeMatrix
): DivisionRangeMatrixData | null {
    if (championship.rangeCount <= 1) {
        return null
    }

    const dayOrders = [...new Set(championship.rounds.map((round) => round.dayOrder))].sort((a, b) => a - b)
    if (dayOrders.length === 0) {
        return null
    }

    const divisions = buildDivisionsWithRegistrationCounts(championship.registrations)
    const assignments = mapDivisionRangeAssignments(championship.divisionRanges)
    const assignmentLookup = buildAssignmentLookup(assignments)

    const rows: DivisionRangeMatrixRow[] = divisions.map((division) => {
        const divisionKey = championshipDivisionKey(
            division.ageGroupId,
            division.genderGroup,
            division.categoryId
        )
        const rangeByDay = Object.fromEntries(
            dayOrders.map((dayOrder) => [
                dayOrder,
                lookupDivisionRangeAssignment(
                    assignmentLookup,
                    dayOrder,
                    division.ageGroupId,
                    division.categoryId,
                    division.genderGroup
                ),
            ])
        ) as Record<number, number | null>

        return {
            divisionKey,
            ageGroupId: division.ageGroupId,
            categoryId: division.categoryId,
            categoryName: division.categoryName,
            ageGroupName: division.ageGroupName,
            genderGroup: division.genderGroup,
            abbrev: participantDivisionAbbrev(division),
            registrationCount: division.registrationCount,
            rangeByDay,
            isCub: /\bcub\b/i.test(division.ageGroupName),
        }
    })

    return {
        dayOrders,
        rangeCount: championship.rangeCount,
        dayOneFrozen: isDayOneRangeAssignmentFrozen(championship.rounds),
        rows,
        totalsByDay: computeDivisionRangeTotalsByDay(dayOrders, championship.rangeCount, rows),
    }
}
