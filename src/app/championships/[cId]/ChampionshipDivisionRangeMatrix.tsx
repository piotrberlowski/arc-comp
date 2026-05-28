"use client"

import FormModal from "@/components/FormModal"
import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import DivisionRangeMatrixModalContent from "./DivisionRangeMatrixModalContent"
import DivisionRangeMatrixTotalsHeader from "./DivisionRangeMatrixTotalsHeader"
import MatrixBowStylePanels from "./MatrixBowStylePanels"
import { useDivisionRangeMatrix } from "./useDivisionRangeMatrix"
import type { ChampionshipMatrixRegistration } from "./useDivisionRangeMatrixState"

export type { ChampionshipMatrixRegistration } from "./useDivisionRangeMatrixState"

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
    const {
        matrix,
        bowStyleGroups,
        participantsByDivision,
        modalView,
        participantsModalRef,
        isPending,
        openDivisionParticipants,
        openRangeDayParticipants,
        openBowStyleParticipants,
        handleRangeChange,
        handleCategoryDayAction,
        handleClearCategoryDay,
        handleClearCategory,
        handleClearDay,
    } = useDivisionRangeMatrix({ championshipId, initialMatrix, registrations })

    if (!matrix || matrix.rows.length === 0) {
        return null
    }

    return (
        <div className="space-y-4">
            {matrix.dayOneFrozen ? (
                <p className="text-sm text-warning">
                    Day 1 assignments are frozen because scores have been entered on a day-1 range tournament.
                </p>
            ) : null}
            <div className="card bg-base-200 shadow-sm">
                <div className="card-body py-4 gap-3">
                    <DivisionRangeMatrixTotalsHeader
                        dayOrders={matrix.dayOrders}
                        totalsByDay={matrix.totalsByDay}
                        dayOneFrozen={matrix.dayOneFrozen}
                        readOnly={readOnly}
                        isPending={isPending}
                        onRangeDayClick={openRangeDayParticipants}
                        onClearDay={handleClearDay}
                    />
                </div>
            </div>
            <MatrixBowStylePanels
                groups={bowStyleGroups}
                dayOrders={matrix.dayOrders}
                rangeCount={matrix.rangeCount}
                dayOneFrozen={matrix.dayOneFrozen}
                readOnly={readOnly}
                isPending={isPending}
                onRangeChange={handleRangeChange}
                onShowParticipants={openDivisionParticipants}
                onShowBowStyleParticipants={openBowStyleParticipants}
                onCategoryDayAction={handleCategoryDayAction}
                onClearCategoryDay={handleClearCategoryDay}
                onClearCategory={handleClearCategory}
            />
            <p className="text-sm text-base-content/70">
                Assign every division to a range on each day before enrolling competitors on multi-range championships.
                A division cannot use the same range on more than one day. Unassigning a division unenrolls affected
                competitors from that range.
            </p>
            <FormModal ref={participantsModalRef}>
                <DivisionRangeMatrixModalContent
                    modalView={modalView}
                    matrix={matrix}
                    participantsByDivision={participantsByDivision}
                />
            </FormModal>
        </div>
    )
}
