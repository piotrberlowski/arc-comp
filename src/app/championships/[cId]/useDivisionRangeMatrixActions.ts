"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import { useTransition, type Dispatch, type SetStateAction } from "react"
import type { FormModalHandle } from "@/components/FormModal"
import { createMatrixRangeActionHandlers } from "./matrixRangeActionHandlers"
import { createMatrixModalOpeners } from "./matrixModalOpeners"
import { useApplyRangeAssignments } from "./useApplyRangeAssignments"
import { useCategoryRangeUpdates } from "./useCategoryRangeUpdates"
import type { MatrixModalView } from "./useDivisionRangeMatrixState"

export function useDivisionRangeMatrixActions({
    championshipId,
    matrixRef,
    setMatrix,
    skipNextInitialMatrixSyncRef,
    setModalView,
    participantsModalRef,
}: {
    championshipId: string
    matrixRef: { current: DivisionRangeMatrixData | null }
    setMatrix: Dispatch<SetStateAction<DivisionRangeMatrixData | null>>
    skipNextInitialMatrixSyncRef: { current: boolean }
    setModalView: Dispatch<SetStateAction<MatrixModalView | null>>
    participantsModalRef: { current: FormModalHandle | null }
}) {
    const setError = useErrorContext()
    const [, startTransition] = useTransition()
    const applyRangeAssignments = useApplyRangeAssignments({
        championshipId,
        matrixRef,
        setMatrix,
        skipNextInitialMatrixSyncRef,
    })
    const { isPending, runCategoryUpdates } = useCategoryRangeUpdates({
        matrixRef,
        applyRangeAssignments,
    })
    const modalOpeners = createMatrixModalOpeners({ setModalView, participantsModalRef })
    const rangeHandlers = createMatrixRangeActionHandlers({ matrixRef, runCategoryUpdates })

    return {
        isPending,
        ...modalOpeners,
        ...rangeHandlers,
        handleRangeChange: (divisionKey: string, dayOrder: number, rangeNumber: number | null) => {
            startTransition(() => {
                void applyRangeAssignments([{ divisionKey, dayOrder, rangeNumber }]).catch((error) => {
                    setError(error instanceof Error ? error.message : "Unable to update range assignment")
                })
            })
        },
    }
}
