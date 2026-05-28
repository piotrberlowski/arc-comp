import type { DivisionRangeMatrixData, DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import { clearCategorySuccessMessage } from "./divisionRangeMatrixHandlers"

type RunCategoryUpdates = (
    rows: DivisionRangeMatrixRow[],
    dayOrder: number | "all",
    rangeNumber: number | null,
    emptyMessage: string,
    successMessage?: string
) => void

export function createMatrixRangeActionHandlers({
    matrixRef,
    runCategoryUpdates,
}: {
    matrixRef: { current: DivisionRangeMatrixData | null }
    runCategoryUpdates: RunCategoryUpdates
}) {
    return {
        handleCategoryDayAction: (
            rows: DivisionRangeMatrixRow[],
            dayOrder: number,
            rangeNumber: number
        ) => {
            runCategoryUpdates(
                rows,
                dayOrder,
                rangeNumber,
                `No divisions in this category could be assigned to range ${rangeNumber} on day ${dayOrder} (already set or blocked on another day).`
            )
        },
        handleClearCategoryDay: (rows: DivisionRangeMatrixRow[], dayOrder: number) => {
            runCategoryUpdates(
                rows,
                dayOrder,
                null,
                `No divisions in this category have an assignment on day ${dayOrder} to clear.`
            )
        },
        handleClearCategory: (rows: DivisionRangeMatrixRow[]) => {
            const current = matrixRef.current
            if (!current) {
                return
            }

            runCategoryUpdates(
                rows,
                "all",
                null,
                "No assignments in this category to clear.",
                clearCategorySuccessMessage(rows, current.dayOneFrozen)
            )
        },
        handleClearDay: (dayOrder: number) => {
            const current = matrixRef.current
            if (!current) {
                return
            }

            runCategoryUpdates(current.rows, dayOrder, null, `No assignments on day ${dayOrder} to clear.`)
        },
    }
}
