import { groupMatrixRowsByCategory, matrixRowAsDivision } from "@/lib/divisionRangeMatrixRows"
import { compareDivisionsForMatrix } from "@/lib/championshipDivision"
import type { DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import type { CategoryDivisionGroup } from "./CategoryDivisionsParticipantsModal"
import type { DivisionParticipantEntry } from "./DivisionParticipantsModal"

export function buildModalCategoryGroups(
    rows: DivisionRangeMatrixRow[],
    participantsByDivision: Map<string, DivisionParticipantEntry[]>
): CategoryDivisionGroup[] {
    const compareRows = (left: DivisionRangeMatrixRow, right: DivisionRangeMatrixRow) =>
        compareDivisionsForMatrix(matrixRowAsDivision(left), matrixRowAsDivision(right))

    return groupMatrixRowsByCategory(rows, compareRows).map((group) => ({
        categoryName: group.categoryName,
        divisions: group.rows.map((row) => ({
            abbrev: row.abbrev,
            participants: participantsByDivision.get(row.divisionKey) ?? [],
        })),
    }))
}
