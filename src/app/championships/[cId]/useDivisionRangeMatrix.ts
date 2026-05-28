"use client"

import { useDivisionRangeMatrixActions } from "./useDivisionRangeMatrixActions"
import {
    useDivisionRangeMatrixState,
    type ChampionshipMatrixRegistration,
} from "./useDivisionRangeMatrixState"
import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"

export type { ChampionshipMatrixRegistration }

export function useDivisionRangeMatrix({
    championshipId,
    initialMatrix,
    registrations,
}: {
    championshipId: string
    initialMatrix: DivisionRangeMatrixData | null
    registrations: ChampionshipMatrixRegistration[]
}) {
    const state = useDivisionRangeMatrixState(initialMatrix, registrations)
    const actions = useDivisionRangeMatrixActions({
        championshipId,
        matrixRef: state.matrixRef,
        setMatrix: state.setMatrix,
        skipNextInitialMatrixSyncRef: state.skipNextInitialMatrixSyncRef,
        setModalView: state.setModalView,
        participantsModalRef: state.participantsModalRef,
    })

    return { ...state, ...actions }
}
