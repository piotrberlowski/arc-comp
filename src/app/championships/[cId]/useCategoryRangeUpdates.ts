"use client"

import useErrorContext, { useInfoContext } from "@/components/errors/ErrorContext"
import type { DivisionRangeMatrixData, DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import type { RangeAssignmentUpdate } from "@/lib/championshipRangeRules"
import { useCallback, useTransition } from "react"
import { buildCategoryUpdateAssignments } from "./divisionRangeMatrixHandlers"

export function useCategoryRangeUpdates({
    matrixRef,
    applyRangeAssignments,
}: {
    matrixRef: { current: DivisionRangeMatrixData | null }
    applyRangeAssignments: (assignments: RangeAssignmentUpdate[]) => Promise<DivisionRangeMatrixData | null>
}) {
    const setError = useErrorContext()
    const setInfo = useInfoContext()
    const [isPending, startTransition] = useTransition()

    const runCategoryUpdates = useCallback(
        (
            rows: DivisionRangeMatrixRow[],
            dayOrder: number | "all",
            rangeNumber: number | null,
            emptyMessage: string,
            successMessage?: string
        ) => {
            const current = matrixRef.current
            if (!current) {
                return
            }

            const assignments = buildCategoryUpdateAssignments(current, rows, dayOrder, rangeNumber)
            if (assignments.length === 0) {
                setInfo(emptyMessage)
                return
            }

            setInfo(undefined)
            startTransition(() => {
                void applyRangeAssignments(assignments)
                    .then(() => {
                        if (successMessage) {
                            setInfo(successMessage)
                        }
                    })
                    .catch((error) => {
                        setError(
                            error instanceof Error
                                ? error.message
                                : "Unable to update range assignments"
                        )
                    })
            })
        },
        [applyRangeAssignments, matrixRef, setError, setInfo]
    )

    return { isPending, runCategoryUpdates }
}
