import type { DivisionRangeMatrixData, DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import type { RangeAssignmentUpdate } from "@/lib/championshipRangeRules"

export function computeDivisionRangeTotalsByDay(
    dayOrders: number[],
    rangeCount: number,
    rows: DivisionRangeMatrixRow[]
): DivisionRangeMatrixData["totalsByDay"] {
    const totalsByDay = Object.fromEntries(
        dayOrders.map((dayOrder) => [
            dayOrder,
            Object.fromEntries(Array.from({ length: rangeCount }, (_, index) => [index + 1, 0])) as Record<
                number,
                number
            >,
        ])
    ) as DivisionRangeMatrixData["totalsByDay"]

    for (const row of rows) {
        for (const dayOrder of dayOrders) {
            const rangeNumber = row.rangeByDay[dayOrder]
            if (rangeNumber !== null && rangeNumber !== undefined) {
                totalsByDay[dayOrder][rangeNumber] =
                    (totalsByDay[dayOrder][rangeNumber] ?? 0) + row.registrationCount
            }
        }
    }

    return totalsByDay
}

export function matrixWithAssignments(
    matrix: DivisionRangeMatrixData,
    assignments: RangeAssignmentUpdate[]
): DivisionRangeMatrixData {
    if (assignments.length === 0) {
        return matrix
    }

    const rows = matrix.rows.map((row) => {
        const updates = assignments.filter((assignment) => assignment.divisionKey === row.divisionKey)
        if (updates.length === 0) {
            return row
        }

        const rangeByDay = { ...row.rangeByDay }
        for (const update of updates) {
            rangeByDay[update.dayOrder] = update.rangeNumber
        }

        return { ...row, rangeByDay }
    })

    return {
        ...matrix,
        rows,
        totalsByDay: computeDivisionRangeTotalsByDay(matrix.dayOrders, matrix.rangeCount, rows),
    }
}
