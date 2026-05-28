import { compareDivisionsForMatrix } from "@/lib/championshipDivision"
import type { DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import type { GenderGroup } from "@/generated/prisma/client"

export type MatrixCategoryGroup<T extends { categoryId: string; categoryName: string }> = {
    categoryId: string
    categoryName: string
    rows: T[]
}

export type MatrixBowStyleGroup = MatrixCategoryGroup<DivisionRangeMatrixRow> & {
    participantCount: number
}

export function matrixRowAsDivision(row: DivisionRangeMatrixRow) {
    return {
        ageGroupId: row.ageGroupId,
        categoryId: row.categoryId,
        genderGroup: row.genderGroup as GenderGroup,
        ageGroupName: row.ageGroupName,
        categoryName: row.categoryName,
    }
}

export function groupMatrixRowsByCategory<T extends { categoryId: string; categoryName: string }>(
    rows: T[],
    compareRows?: (left: T, right: T) => number
): MatrixCategoryGroup<T>[] {
    const byCategory = new Map<string, MatrixCategoryGroup<T>>()
    const sourceRows = compareRows ? [...rows].sort(compareRows) : rows

    for (const row of sourceRows) {
        const existing = byCategory.get(row.categoryId)
        if (existing) {
            existing.rows.push(row)
            continue
        }
        byCategory.set(row.categoryId, {
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            rows: [row],
        })
    }

    return [...byCategory.values()].sort((left, right) =>
        left.categoryName.localeCompare(right.categoryName)
    )
}

export function groupMatrixRowsByBowCategory(rows: DivisionRangeMatrixRow[]): MatrixBowStyleGroup[] {
    const compareRows = (left: DivisionRangeMatrixRow, right: DivisionRangeMatrixRow) =>
        compareDivisionsForMatrix(matrixRowAsDivision(left), matrixRowAsDivision(right))

    return groupMatrixRowsByCategory(rows, compareRows).map((group) => ({
        ...group,
        participantCount: group.rows.reduce((sum, row) => sum + row.registrationCount, 0),
    }))
}
