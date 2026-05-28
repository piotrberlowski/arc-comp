import type { DivisionRangeMatrixData, DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import CategoryDivisionsParticipantsModal from "./CategoryDivisionsParticipantsModal"
import DivisionParticipantsModal, { type DivisionParticipantEntry } from "./DivisionParticipantsModal"
import { buildModalCategoryGroups } from "./divisionRangeMatrixModalGroups"

import type { MatrixModalView } from "./useDivisionRangeMatrixState"

export default function DivisionRangeMatrixModalContent({
    modalView,
    matrix,
    participantsByDivision,
}: {
    modalView: MatrixModalView | null
    matrix: DivisionRangeMatrixData | null
    participantsByDivision: Map<string, DivisionParticipantEntry[]>
}) {
    if (!modalView) {
        return null
    }
    if (modalView.kind === "division") {
        return (
            <DivisionParticipantsModal
                abbrev={modalView.abbrev}
                participants={participantsByDivision.get(modalView.divisionKey) ?? []}
            />
        )
    }
    if (modalView.kind === "rangeDay") {
        const rows = (matrix?.rows ?? []).filter(
            (row) => row.rangeByDay[modalView.dayOrder] === modalView.rangeNumber
        )
        return (
            <CategoryDivisionsParticipantsModal
                title={`Day ${modalView.dayOrder} · Range ${modalView.rangeNumber}`}
                groups={buildModalCategoryGroups(rows, participantsByDivision)}
            />
        )
    }
    return (
        <CategoryDivisionsParticipantsModal
            title={modalView.categoryName}
            groups={buildModalCategoryGroups(modalView.rows, participantsByDivision)}
        />
    )
}
