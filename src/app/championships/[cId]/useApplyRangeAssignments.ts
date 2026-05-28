"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import type { RangeAssignmentUpdate } from "@/lib/championshipRangeRules"
import { useCallback, type Dispatch, type SetStateAction } from "react"
import { applyRangeAssignmentsWithAutoFill } from "./divisionRangeMatrixMutations"

export function useApplyRangeAssignments({
    championshipId,
    matrixRef,
    setMatrix,
    skipNextInitialMatrixSyncRef,
}: {
    championshipId: string
    matrixRef: { current: DivisionRangeMatrixData | null }
    setMatrix: Dispatch<SetStateAction<DivisionRangeMatrixData | null>>
    skipNextInitialMatrixSyncRef: { current: boolean }
}) {
    const setError = useErrorContext()

    return useCallback(
        (assignments: RangeAssignmentUpdate[]) => {
            if (assignments.length === 0) {
                return Promise.resolve(matrixRef.current)
            }

            const rollbackMatrix = matrixRef.current
            setError(undefined)

            return applyRangeAssignmentsWithAutoFill({
                championshipId,
                assignments,
                rollbackMatrix,
                setMatrix,
                matrixRef,
            }).then((data) => {
                if (data) {
                    skipNextInitialMatrixSyncRef.current = true
                }
                return data
            })
        },
        [championshipId, matrixRef, setError, setMatrix, skipNextInitialMatrixSyncRef]
    )
}
