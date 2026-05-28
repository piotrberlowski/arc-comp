"use client"

import { matrixWithAssignments } from "@/lib/divisionRangeMatrixTotals"
import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import {
    collectSoleAvailableRangeAssignments,
    isMatrixRowInAutoFillScope,
    matrixRowsForAutoFillAfterAssign,
    type RangeAssignmentUpdate,
} from "@/lib/championshipRangeRules"
import type { Dispatch, SetStateAction } from "react"
import {
    getChampionshipDivisionRangeMatrix,
    setChampionshipDivisionRangeAssignments,
} from "../championshipActions"

async function restoreMatrixAfterFailedUpdate({
    championshipId,
    rollbackMatrix,
    setMatrix,
    matrixRef,
}: {
    championshipId: string
    rollbackMatrix: DivisionRangeMatrixData | null
    setMatrix: Dispatch<SetStateAction<DivisionRangeMatrixData | null>>
    matrixRef: { current: DivisionRangeMatrixData | null }
}) {
    const fresh = await getChampionshipDivisionRangeMatrix(championshipId).catch(() => null)
    const nextMatrix = fresh ?? rollbackMatrix
    setMatrix(nextMatrix)
    matrixRef.current = nextMatrix
    return nextMatrix
}

async function runAutoFillPasses({
    championshipId,
    assignments,
    currentMatrix,
    setMatrix,
}: {
    championshipId: string
    assignments: RangeAssignmentUpdate[]
    currentMatrix: DivisionRangeMatrixData
    setMatrix: Dispatch<SetStateAction<DivisionRangeMatrixData | null>>
}) {
    const autoFillScope = matrixRowsForAutoFillAfterAssign(currentMatrix.rows, assignments)
    if (autoFillScope.length === 0) {
        return currentMatrix
    }

    let matrix = currentMatrix
    let autoAssignments = collectSoleAvailableRangeAssignments(
        matrix.rows.filter((row) => isMatrixRowInAutoFillScope(row, autoFillScope)),
        matrix.dayOrders,
        matrix.rangeCount,
        matrix.dayOneFrozen
    )

    let passes = 0
    while (autoAssignments.length > 0 && passes < matrix.dayOrders.length) {
        setMatrix(matrixWithAssignments(matrix, autoAssignments))
        matrix =
            (await setChampionshipDivisionRangeAssignments(championshipId, autoAssignments)) ?? matrix
        autoAssignments = collectSoleAvailableRangeAssignments(
            matrix.rows.filter((row) => isMatrixRowInAutoFillScope(row, autoFillScope)),
            matrix.dayOrders,
            matrix.rangeCount,
            matrix.dayOneFrozen
        )
        passes += 1
    }

    return matrix
}

export async function applyRangeAssignmentsWithAutoFill({
    championshipId,
    assignments,
    rollbackMatrix,
    setMatrix,
    matrixRef,
}: {
    championshipId: string
    assignments: RangeAssignmentUpdate[]
    rollbackMatrix: DivisionRangeMatrixData | null
    setMatrix: Dispatch<SetStateAction<DivisionRangeMatrixData | null>>
    matrixRef: { current: DivisionRangeMatrixData | null }
}): Promise<DivisionRangeMatrixData | null> {
    if (assignments.length === 0) {
        return rollbackMatrix
    }

    setMatrix((current) => (current ? matrixWithAssignments(current, assignments) : current))

    try {
        let currentMatrix = await setChampionshipDivisionRangeAssignments(championshipId, assignments)
        if (!currentMatrix) {
            return null
        }

        currentMatrix = await runAutoFillPasses({
            championshipId,
            assignments,
            currentMatrix,
            setMatrix,
        })

        setMatrix(currentMatrix)
        matrixRef.current = currentMatrix
        return currentMatrix
    } catch (error) {
        await restoreMatrixAfterFailedUpdate({ championshipId, rollbackMatrix, setMatrix, matrixRef })
        throw error
    }
}
