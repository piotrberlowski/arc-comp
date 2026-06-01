import type * as ExcelJS from "exceljs"

/** Score columns E–J in templatev5 (six slots after club in D). */
export const IFAF_TEMPLATE_SCORE_COLUMN_COUNT = 6

const FIRST_SCORE_COLUMN = 5

export function scoreColumnCountForExport(participants: { scoreColumns: string[] }[]): number {
    const count = participants[0]?.scoreColumns.length ?? 1
    if (count < 1 || count > IFAF_TEMPLATE_SCORE_COLUMN_COUNT) {
        throw new Error(
            `IFAF export requires 1–${IFAF_TEMPLATE_SCORE_COLUMN_COUNT} score columns, got ${count}`
        )
    }

    return count
}

/** Drops unused score columns from the left (E onward) so the kept block stays right-aligned with the template outer border on the last column. */
export function trimExcessScoreColumns(worksheet: ExcelJS.Worksheet, scoreColumnCount: number): void {
    if (scoreColumnCount < 1 || scoreColumnCount > IFAF_TEMPLATE_SCORE_COLUMN_COUNT) {
        throw new Error(
            `IFAF export requires 1–${IFAF_TEMPLATE_SCORE_COLUMN_COUNT} score columns, got ${scoreColumnCount}`
        )
    }

    const deleteCount = IFAF_TEMPLATE_SCORE_COLUMN_COUNT - scoreColumnCount
    if (deleteCount === 0) {
        return
    }

    worksheet.spliceColumns(FIRST_SCORE_COLUMN, deleteCount)
}

export function fillScoreColumnHeaders(
    worksheet: ExcelJS.Worksheet,
    headerRow: number,
    scoreColumnHeaders: string[]
): void {
    if (scoreColumnHeaders.length <= 1) {
        return
    }

    for (let index = 0; index < scoreColumnHeaders.length; index++) {
        worksheet.getCell(headerRow, FIRST_SCORE_COLUMN + index).value = scoreColumnHeaders[index]
    }
}
