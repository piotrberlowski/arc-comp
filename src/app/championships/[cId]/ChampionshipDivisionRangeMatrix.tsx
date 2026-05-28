"use client"

import FormModal from "@/components/FormModal"
import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import DivisionRangeMatrixModalContent from "./DivisionRangeMatrixModalContent"
import DivisionRangeMatrixTotalsHeader from "./DivisionRangeMatrixTotalsHeader"
import {
    DivisionRangeMatrixProvider,
    useDivisionRangeMatrix,
} from "./DivisionRangeMatrixContext"
import MatrixBowStylePanels from "./MatrixBowStylePanels"
import type { ChampionshipMatrixRegistration } from "./divisionRangeMatrixTypes"

export type { ChampionshipMatrixRegistration } from "./divisionRangeMatrixTypes"

export default function ChampionshipDivisionRangeMatrix({
    championshipId,
    initialMatrix,
    registrations,
    readOnly = false,
}: {
    championshipId: string
    initialMatrix: DivisionRangeMatrixData | null
    registrations: ChampionshipMatrixRegistration[]
    readOnly?: boolean
}) {
    return (
        <DivisionRangeMatrixProvider
            championshipId={championshipId}
            initialMatrix={initialMatrix}
            registrations={registrations}
            readOnly={readOnly}
        >
            <DivisionRangeMatrixView />
        </DivisionRangeMatrixProvider>
    )
}

function DivisionRangeMatrixView() {
    const { matrix, participantsModalRef } = useDivisionRangeMatrix()

    return (
        <div className="space-y-4">
            {matrix.dayOneFrozen ? (
                <p className="text-sm text-warning">
                    Day 1 assignments are frozen because scores have been entered on a day-1 range tournament.
                </p>
            ) : null}
            <div className="card bg-base-200 shadow-sm">
                <div className="card-body py-4 gap-3">
                    <DivisionRangeMatrixTotalsHeader />
                </div>
            </div>
            <MatrixBowStylePanels />
            <p className="text-sm text-base-content/70">
                Assign every division to a range on each day before enrolling competitors on multi-range championships.
                A division cannot use the same range on more than one day. Unassigning a division unenrolls affected
                competitors from that range.
            </p>
            <FormModal ref={participantsModalRef}>
                <DivisionRangeMatrixModalContent />
            </FormModal>
        </div>
    )
}
