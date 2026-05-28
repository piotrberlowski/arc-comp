"use client"

import type { DivisionRangeMatrixData, DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import { groupMatrixRowsByBowCategory } from "@/lib/divisionRangeMatrixRows"
import { useEffect, useMemo, useRef, useState } from "react"
import type { FormModalHandle } from "@/components/FormModal"
import type { DivisionParticipantEntry } from "./DivisionParticipantsModal"

export type ChampionshipMatrixRegistration = DivisionParticipantEntry & {
    divisionKey: string
}

export type MatrixModalView =
    | { kind: "division"; abbrev: string; divisionKey: string }
    | { kind: "rangeDay"; dayOrder: number; rangeNumber: number }
    | { kind: "bowStyle"; categoryName: string; rows: DivisionRangeMatrixRow[] }

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

export function useDivisionRangeMatrixState(
    initialMatrix: DivisionRangeMatrixData | null,
    registrations: ChampionshipMatrixRegistration[]
) {
    const participantsModalRef = useRef<FormModalHandle>(null)
    const skipNextInitialMatrixSyncRef = useRef(false)
    const matrixRef = useRef<DivisionRangeMatrixData | null>(initialMatrix)
    const [matrix, setMatrix] = useState<DivisionRangeMatrixData | null>(initialMatrix)
    const [modalView, setModalView] = useState<MatrixModalView | null>(null)

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

    return {
        matrix,
        setMatrix,
        matrixRef,
        skipNextInitialMatrixSyncRef,
        modalView,
        setModalView,
        participantsModalRef,
        bowStyleGroups,
        participantsByDivision,
    }
}
