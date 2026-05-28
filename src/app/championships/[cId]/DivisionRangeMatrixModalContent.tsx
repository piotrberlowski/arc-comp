import CategoryDivisionsParticipantsModal from "./CategoryDivisionsParticipantsModal"
import DivisionParticipantsModal from "./DivisionParticipantsModal"
import { useDivisionRangeMatrix } from "./DivisionRangeMatrixContext"
import { buildModalCategoryGroups } from "./divisionRangeMatrixModalGroups"

export default function DivisionRangeMatrixModalContent() {
    const { modalView, matrix, participantsByDivision } = useDivisionRangeMatrix()

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
        const rows = matrix.rows.filter(
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
