import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import { matrixWithAssignments } from "@/lib/divisionRangeMatrixTotals"
import {
    collectSoleAvailableRangeAssignments,
    isMatrixRowInAutoFillScope,
    matrixRowsForAutoFillAfterAssign,
    type RangeAssignmentUpdate,
} from "@/lib/championshipRangeRules"

export type DivisionRangeMatrixGateway = {
    setAssignments: (
        championshipId: string,
        assignments: RangeAssignmentUpdate[]
    ) => Promise<DivisionRangeMatrixData | null>
    loadMatrix: (championshipId: string) => Promise<DivisionRangeMatrixData | null>
}

export type DivisionRangeMatrixStore = {
    getSnapshot: () => DivisionRangeMatrixData | null
    setOptimistic: (matrix: DivisionRangeMatrixData | null) => void
    setCommitted: (matrix: DivisionRangeMatrixData | null) => void
    markApplySuccess: () => void
}

export class DivisionRangeMatrixController {
    constructor(
        private readonly championshipId: string,
        private readonly gateway: DivisionRangeMatrixGateway,
        private readonly store: DivisionRangeMatrixStore
    ) {}

    async applyAssignments(assignments: RangeAssignmentUpdate[]): Promise<DivisionRangeMatrixData | null> {
        if (assignments.length === 0) {
            return this.store.getSnapshot()
        }

        const rollback = this.store.getSnapshot()
        const optimisticBase = rollback
        if (optimisticBase) {
            this.store.setOptimistic(matrixWithAssignments(optimisticBase, assignments))
        }

        try {
            let currentMatrix = await this.gateway.setAssignments(this.championshipId, assignments)
            if (!currentMatrix) {
                return null
            }

            currentMatrix = await this.runAutoFillPasses(assignments, currentMatrix)
            this.store.setCommitted(currentMatrix)
            this.store.markApplySuccess()
            return currentMatrix
        } catch (error) {
            await this.restoreAfterFailure(rollback)
            throw error
        }
    }

    private async runAutoFillPasses(
        assignments: RangeAssignmentUpdate[],
        currentMatrix: DivisionRangeMatrixData
    ): Promise<DivisionRangeMatrixData> {
        const autoFillScope = matrixRowsForAutoFillAfterAssign(currentMatrix.rows, assignments)
        if (autoFillScope.length === 0) {
            return currentMatrix
        }

        let matrix = currentMatrix
        let autoAssignments = this.collectAutoFill(matrix, autoFillScope)

        let passes = 0
        while (autoAssignments.length > 0 && passes < matrix.dayOrders.length) {
            matrix = matrixWithAssignments(matrix, autoAssignments)
            this.store.setOptimistic(matrix)
            matrix =
                (await this.gateway.setAssignments(this.championshipId, autoAssignments)) ?? matrix
            autoAssignments = this.collectAutoFill(matrix, autoFillScope)
            passes += 1
        }

        return matrix
    }

    private collectAutoFill(
        matrix: DivisionRangeMatrixData,
        autoFillScope: ReturnType<typeof matrixRowsForAutoFillAfterAssign>
    ) {
        return collectSoleAvailableRangeAssignments(
            matrix.rows.filter((row) => isMatrixRowInAutoFillScope(row, autoFillScope)),
            matrix.dayOrders,
            matrix.rangeCount,
            matrix.dayOneFrozen
        )
    }

    private async restoreAfterFailure(rollback: DivisionRangeMatrixData | null) {
        const fresh = await this.gateway.loadMatrix(this.championshipId).catch(() => null)
        this.store.setCommitted(fresh ?? rollback)
    }
}
