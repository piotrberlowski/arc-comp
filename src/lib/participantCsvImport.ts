import { GenderGroup } from "@/generated/prisma/enums"
import type { ParticipantProfileInput } from "@/lib/participantProfileSchema"
import { prismaOrThrow } from "@/lib/prisma"
import Papa from "papaparse"

export interface CSVImportState {
    success: boolean
    message: string
    importedCount: number
    errors: string[]
}

interface ParseError {
    row: number
    message: string
}

export interface ValidationMaps {
    ageGroups: Set<string>
    categories: Set<string>
    ageGroupMap: Map<string, string>
    categoryMap: Map<string, string>
}

type ColumnTransformer<T> = (value: string, rowNumber: number, maps: ValidationMaps) => { value: T; error?: string }

const createRequiredStringTransformer = (fieldName: string): ColumnTransformer<string> => {
    return (value: string, rowNumber: number) => {
        const trimmed = value.trim()
        if (!trimmed) {
            return { value: "", error: `Row ${rowNumber}: ${fieldName} is required` }
        }
        return { value: trimmed }
    }
}

const createGenderTransformer = (): ColumnTransformer<GenderGroup> => {
    return (value: string, rowNumber: number) => {
        const trimmed = value.trim().toUpperCase()

        if (trimmed === "M" || trimmed === "MALE") {
            return { value: GenderGroup.M }
        }

        if (trimmed === "F" || trimmed === "FEMALE") {
            return { value: GenderGroup.F }
        }

        return {
            value: GenderGroup.M,
            error: `Row ${rowNumber}: Gender must be 'F', 'M', 'female', or 'male', got '${value}'`,
        }
    }
}

const createAgeGroupTransformer = (): ColumnTransformer<string> => {
    return (value: string, rowNumber: number, maps: ValidationMaps) => {
        const trimmed = value.trim()
        if (!trimmed) {
            return { value: "", error: `Row ${rowNumber}: Age group ID is required` }
        }

        if (maps.ageGroups.has(trimmed)) {
            return { value: trimmed }
        }

        const normalizedInput = trimmed.toLowerCase()
        for (const [id, name] of maps.ageGroupMap.entries()) {
            if (name.toLowerCase() === normalizedInput) {
                return { value: id }
            }
        }

        return { value: trimmed, error: `Row ${rowNumber}: Age group '${trimmed}' not found` }
    }
}

const createCategoryTransformer = (): ColumnTransformer<string> => {
    return (value: string, rowNumber: number, maps: ValidationMaps) => {
        const trimmed = value.trim()
        if (!trimmed) {
            return { value: "", error: `Row ${rowNumber}: Equipment category ID is required` }
        }

        if (maps.categories.has(trimmed)) {
            return { value: trimmed }
        }

        const normalizedInput = trimmed.toLowerCase()
        for (const [id, name] of maps.categoryMap.entries()) {
            if (name.toLowerCase() === normalizedInput) {
                return { value: id }
            }
        }

        return { value: trimmed, error: `Row ${rowNumber}: Equipment category '${trimmed}' not found` }
    }
}

const createOptionalStringTransformer = (): ColumnTransformer<string> => {
    return (value: string) => {
        return { value: value.trim() }
    }
}

function createColumnTransformers(): ColumnTransformer<unknown>[] {
    return [
        createRequiredStringTransformer("Full name"),
        createRequiredStringTransformer("Membership number"),
        createGenderTransformer(),
        createAgeGroupTransformer(),
        createCategoryTransformer(),
        createOptionalStringTransformer(),
    ]
}

function processRow(
    row: string[],
    rowNumber: number,
    maps: ValidationMaps,
    columnTransformers: ColumnTransformer<unknown>[]
): { profile?: ParticipantProfileInput; errors: ParseError[] } {
    if (row.length < columnTransformers.length) {
        return {
            errors: [{
                row: rowNumber,
                message: `Row ${rowNumber}: Expected ${columnTransformers.length} columns, found ${row.length}`,
            }],
        }
    }

    const results = columnTransformers.map((transformer, index) =>
        transformer(row[index], rowNumber, maps) as { value: unknown; error?: string }
    )

    const rowErrors = results
        .filter((result) => result.error)
        .map((result) => ({ row: rowNumber, message: result.error! }))

    if (rowErrors.length > 0) {
        return { errors: rowErrors }
    }

    return {
        profile: {
            name: results[0].value as string,
            membershipNo: results[1].value as string,
            genderGroup: results[2].value as "F" | "M",
            ageGroupId: results[3].value as string,
            categoryId: results[4].value as string,
            club: results[5].value as string,
        },
        errors: [],
    }
}

export async function parseParticipantCsv(
    csvText: string,
    maps: ValidationMaps
): Promise<{ profiles: ParticipantProfileInput[]; errors: ParseError[] }> {
    const profiles: ParticipantProfileInput[] = []
    const errors: ParseError[] = []
    let rowNumber = 0
    const columnTransformers = createColumnTransformers()

    Papa.parse<string[]>(csvText, {
        skipEmptyLines: true,
        header: false,
        step: (result) => {
            rowNumber++
            const { profile, errors: rowErrors } = processRow(result.data, rowNumber, maps, columnTransformers)
            errors.push(...rowErrors)
            if (profile) {
                profiles.push(profile)
            }
        },
        complete: (results) => {
            if (results.errors.length > 0) {
                errors.push(...results.errors.map((error) => ({
                    row: error.row !== undefined ? error.row + 1 : 0,
                    message: `CSV parsing error: ${error.message}`,
                })))
            }
        },
        error: (error: Error) => {
            errors.push({ row: 0, message: `CSV parsing error: ${error.message}` })
        },
    })

    return { profiles, errors }
}

export async function fetchParticipantValidationMaps(): Promise<ValidationMaps> {
    const prisma = prismaOrThrow("fetch validation maps")

    const [ageGroups, categories] = await Promise.all([
        prisma.ageGroup.findMany({ select: { id: true, name: true } }),
        prisma.equipmentCategory.findMany({ select: { id: true, name: true } }),
    ])

    const ageGroupMap = new Map<string, string>()
    const categoryMap = new Map<string, string>()

    ageGroups.forEach((ageGroup) => {
        ageGroupMap.set(ageGroup.id, ageGroup.name)
    })

    categories.forEach((category) => {
        categoryMap.set(category.id, category.name)
    })

    return {
        ageGroups: new Set(ageGroups.map((ageGroup) => ageGroup.id)),
        categories: new Set(categories.map((category) => category.id)),
        ageGroupMap,
        categoryMap,
    }
}

export function formatImportPrismaError(error: unknown): string {
    if (error && typeof error === "object" && "code" in error) {
        const prismaError = error as { code: string; meta?: { target?: string[] }; message: string }

        if (prismaError.code === "P2002") {
            const field = prismaError.meta?.target?.join(", ") || "field"
            return `Duplicate entry: A row with the same value of (${field}) already exists`
        }

        if (prismaError.code === "P2003") {
            return "Invalid reference: The referenced record does not exist"
        }

        if (prismaError.message) {
            return prismaError.message
        }
    }

    if (error instanceof Error) {
        return error.message
    }

    return "Unknown error occurred during import"
}

export function parseErrorsToImportState(parseErrors: ParseError[]): CSVImportState {
    return {
        success: false,
        message: `CSV parsing failed with ${parseErrors.length} error(s)`,
        importedCount: 0,
        errors: parseErrors.map((error) => error.message),
    }
}

export const participantCsvColumnHelp =
    "1. Full Name, 2. Membership Number, 3. Gender (F/M), 4. Age Group ID, 5. Equipment Category ID, 6. Club Name"
