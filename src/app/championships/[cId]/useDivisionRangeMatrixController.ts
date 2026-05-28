"use client"

import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import {
    DivisionRangeMatrixController,
    type DivisionRangeMatrixGateway,
    type DivisionRangeMatrixStore,
} from "@/lib/divisionRangeMatrixController"
import { useRef } from "react"
import {
    getChampionshipDivisionRangeMatrix,
    setChampionshipDivisionRangeAssignments,
} from "../championshipActions"

const gateway: DivisionRangeMatrixGateway = {
    setAssignments: setChampionshipDivisionRangeAssignments,
    loadMatrix: getChampionshipDivisionRangeMatrix,
}

export function useDivisionRangeMatrixController({
    championshipId,
    matrixRef,
    setMatrix,
    skipNextInitialMatrixSyncRef,
}: {
    championshipId: string
    matrixRef: React.RefObject<DivisionRangeMatrixData | null>
    setMatrix: React.Dispatch<React.SetStateAction<DivisionRangeMatrixData | null>>
    skipNextInitialMatrixSyncRef: React.RefObject<boolean>
}) {
    const controllerRef = useRef<DivisionRangeMatrixController | null>(null)
    const championshipIdRef = useRef(championshipId)

    if (!controllerRef.current || championshipIdRef.current !== championshipId) {
        championshipIdRef.current = championshipId
        const store: DivisionRangeMatrixStore = {
            getSnapshot: () => matrixRef.current,
            setOptimistic: (matrix) => setMatrix(matrix),
            setCommitted: (matrix) => {
                setMatrix(matrix)
                matrixRef.current = matrix
            },
            markApplySuccess: () => {
                skipNextInitialMatrixSyncRef.current = true
            },
        }
        controllerRef.current = new DivisionRangeMatrixController(championshipId, gateway, store)
    }

    return controllerRef.current
}
