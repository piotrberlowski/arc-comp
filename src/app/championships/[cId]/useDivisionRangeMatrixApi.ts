"use client"

import useErrorContext, { useInfoContext } from "@/components/errors/ErrorContext"
import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import type { DivisionRangeMatrixController } from "@/lib/divisionRangeMatrixController"
import type { DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import { useCallback, useTransition } from "react"
import {
    buildCategoryUpdateAssignments,
    clearCategorySuccessMessage,
} from "./divisionRangeMatrixHandlers"
import type { MatrixModalView } from "./divisionRangeMatrixTypes"

export function useDivisionRangeMatrixApi({
    controller,
    matrixRef,
    setModalView,
    openModalRef,
}: {
    controller: DivisionRangeMatrixController
    matrixRef: React.RefObject<DivisionRangeMatrixData | null>
    setModalView: React.Dispatch<React.SetStateAction<MatrixModalView | null>>
    openModalRef: React.RefObject<{ open: () => void } | null>
}) {
    const setError = useErrorContext()
    const setInfo = useInfoContext()
    const [isPending, startTransition] = useTransition()

    const applyAssignments = useCallback(
        (assignments: Parameters<DivisionRangeMatrixController["applyAssignments"]>[0]) => {
            setError(undefined)
            return controller.applyAssignments(assignments)
        },
        [controller, setError]
    )

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
                void applyAssignments(assignments)
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
        [applyAssignments, matrixRef, setError, setInfo]
    )

    const openModal = useCallback(
        (view: MatrixModalView) => {
            setModalView(view)
            openModalRef.current?.open()
        },
        [openModalRef, setModalView]
    )

    return {
        isPending,
        startTransition,
        applyAssignments,
        runCategoryUpdates,
        openModal,
        setError,
    }
}
