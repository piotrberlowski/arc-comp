import type { DivisionRangeMatrixData, DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import {
    buildCategoryRangeUpdates,
    categoryHasAssignmentOnFrozenDayOne,
    type RangeAssignmentUpdate,
} from "@/lib/championshipRangeRules"

export function buildCategoryUpdateAssignments(
    matrix: DivisionRangeMatrixData,
    rows: DivisionRangeMatrixRow[],
    dayOrder: number | "all",
    rangeNumber: number | null
): RangeAssignmentUpdate[] {
    return buildCategoryRangeUpdates(
        rows,
        matrix.dayOrders,
        dayOrder,
        rangeNumber,
        matrix.dayOneFrozen
    )
}

export function clearCategorySuccessMessage(
    rows: DivisionRangeMatrixRow[],
    dayOneFrozen: boolean
): string | undefined {
    const skippedFrozenDayOne = categoryHasAssignmentOnFrozenDayOne(rows, dayOneFrozen)
    if (!skippedFrozenDayOne) {
        return undefined
    }
    return "Cleared this category on all editable days. Day 1 assignments are frozen and were not changed."
}
