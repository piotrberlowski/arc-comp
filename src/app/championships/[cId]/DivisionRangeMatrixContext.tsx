"use client"

import type { FormModalHandle } from "@/components/FormModal"
import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import { groupMatrixRowsByBowCategory } from "@/lib/divisionRangeMatrixRows"
import type { MatrixBowStyleGroup } from "@/lib/divisionRangeMatrixRows"
import type { DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react"
import type { ChampionshipMatrixRegistration, MatrixModalView } from "./divisionRangeMatrixTypes"
import type { DivisionParticipantEntry } from "./DivisionParticipantsModal"
import { clearCategorySuccessMessage } from "./divisionRangeMatrixHandlers"
import { useDivisionRangeMatrixApi } from "./useDivisionRangeMatrixApi"
import { useDivisionRangeMatrixController } from "./useDivisionRangeMatrixController"

export type DivisionRangeMatrixContextValue = {
    matrix: DivisionRangeMatrixData
    readOnly: boolean
    isPending: boolean
    bowStyleGroups: MatrixBowStyleGroup[]
    participantsByDivision: Map<string, DivisionParticipantEntry[]>
    participantsModalRef: React.RefObject<FormModalHandle | null>
    modalView: MatrixModalView | null
    assignRange: (divisionKey: string, dayOrder: number, rangeNumber: number | null) => void
    assignCategoryDay: (rows: DivisionRangeMatrixRow[], dayOrder: number, rangeNumber: number) => void
    clearCategoryDay: (rows: DivisionRangeMatrixRow[], dayOrder: number) => void
    clearCategory: (rows: DivisionRangeMatrixRow[]) => void
    clearDay: (dayOrder: number) => void
    showDivisionParticipants: (abbrev: string, divisionKey: string) => void
    showRangeDayParticipants: (dayOrder: number, rangeNumber: number) => void
    showBowStyleParticipants: (categoryName: string, rows: DivisionRangeMatrixRow[]) => void
}

const DivisionRangeMatrixContext = createContext<DivisionRangeMatrixContextValue | null>(null)

function groupParticipantsByDivision(registrations: ChampionshipMatrixRegistration[]) {
    const grouped = new Map<string, DivisionParticipantEntry[]>()
    for (const registration of registrations) {
        const existing = grouped.get(registration.divisionKey) ?? []
        existing.push({
            name: registration.name,
            membershipNo: registration.membershipNo,
            competitorNumber: registration.competitorNumber,
            club: registration.club,
        })
        grouped.set(registration.divisionKey, existing)
    }
    return grouped
}

export function DivisionRangeMatrixProvider({
    championshipId,
    initialMatrix,
    registrations,
    readOnly = false,
    children,
}: {
    championshipId: string
    initialMatrix: DivisionRangeMatrixData | null
    registrations: ChampionshipMatrixRegistration[]
    readOnly?: boolean
    children: ReactNode
}) {
    const participantsModalRef = useRef<FormModalHandle>(null)
    const skipNextInitialMatrixSyncRef = useRef(false)
    const matrixRef = useRef<DivisionRangeMatrixData | null>(initialMatrix)
    const [matrix, setMatrix] = useState<DivisionRangeMatrixData | null>(initialMatrix)
    const [modalView, setModalView] = useState<MatrixModalView | null>(null)

    const controller = useDivisionRangeMatrixController({
        championshipId,
        matrixRef,
        setMatrix,
        skipNextInitialMatrixSyncRef,
    })

    const api = useDivisionRangeMatrixApi({
        controller,
        matrixRef,
        setModalView,
        openModalRef: participantsModalRef,
    })

    useEffect(() => {
        matrixRef.current = matrix
    }, [matrix])

    useEffect(() => {
        if (skipNextInitialMatrixSyncRef.current) {
            skipNextInitialMatrixSyncRef.current = false
            return
        }
        setMatrix(initialMatrix)
        matrixRef.current = initialMatrix
    }, [initialMatrix])

    const bowStyleGroups = useMemo(
        () => (matrix ? groupMatrixRowsByBowCategory(matrix.rows) : []),
        [matrix]
    )

    const participantsByDivision = useMemo(
        () => groupParticipantsByDivision(registrations),
        [registrations]
    )

    const value = useMemo((): DivisionRangeMatrixContextValue | null => {
        if (!matrix || matrix.rows.length === 0) {
            return null
        }

        return {
            matrix,
            readOnly,
            isPending: api.isPending,
            bowStyleGroups,
            participantsByDivision,
            participantsModalRef,
            modalView,
            assignRange: (divisionKey, dayOrder, rangeNumber) => {
                api.startTransition(() => {
                    void api.applyAssignments([{ divisionKey, dayOrder, rangeNumber }]).catch((error) => {
                        api.setError(
                            error instanceof Error ? error.message : "Unable to update range assignment"
                        )
                    })
                })
            },
            assignCategoryDay: (rows, dayOrder, rangeNumber) => {
                api.runCategoryUpdates(
                    rows,
                    dayOrder,
                    rangeNumber,
                    `No divisions in this category could be assigned to range ${rangeNumber} on day ${dayOrder} (already set or blocked on another day).`
                )
            },
            clearCategoryDay: (rows, dayOrder) => {
                api.runCategoryUpdates(
                    rows,
                    dayOrder,
                    null,
                    `No divisions in this category have an assignment on day ${dayOrder} to clear.`
                )
            },
            clearCategory: (rows) => {
                api.runCategoryUpdates(
                    rows,
                    "all",
                    null,
                    "No assignments in this category to clear.",
                    clearCategorySuccessMessage(rows, matrix.dayOneFrozen)
                )
            },
            clearDay: (dayOrder) => {
                api.runCategoryUpdates(
                    matrix.rows,
                    dayOrder,
                    null,
                    `No assignments on day ${dayOrder} to clear.`
                )
            },
            showDivisionParticipants: (abbrev, divisionKey) => {
                api.openModal({ kind: "division", abbrev, divisionKey })
            },
            showRangeDayParticipants: (dayOrder, rangeNumber) => {
                api.openModal({ kind: "rangeDay", dayOrder, rangeNumber })
            },
            showBowStyleParticipants: (categoryName, rows) => {
                api.openModal({ kind: "bowStyle", categoryName, rows })
            },
        }
    }, [api, bowStyleGroups, matrix, modalView, participantsByDivision, readOnly])

    if (!value) {
        return null
    }

    return (
        <DivisionRangeMatrixContext.Provider value={value}>{children}</DivisionRangeMatrixContext.Provider>
    )
}

export function useDivisionRangeMatrix() {
    const context = useContext(DivisionRangeMatrixContext)
    if (!context) {
        throw new Error("useDivisionRangeMatrix must be used within DivisionRangeMatrixProvider")
    }
    return context
}
