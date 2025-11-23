"use server"

import { Participant } from "@/generated/prisma/client"
import { GenderGroup } from "@/generated/prisma/enums"
import { prismaOrThrow } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
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

interface ParseResult {
    participants: Omit<Participant, 'id'>[]
    errors: ParseError[]
}

export interface ValidationMaps {
    ageGroups: Set<string>
    categories: Set<string>
    ageGroupMap: Map<string, string> // id -> name
    categoryMap: Map<string, string> // id -> name
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

        if (trimmed === 'M' || trimmed === 'MALE') {
            return { value: GenderGroup.M }
        }

        if (trimmed === 'F' || trimmed === 'FEMALE') {
            return { value: GenderGroup.F }
        }

        return { value: 'M' as GenderGroup, error: `Row ${rowNumber}: Gender must be 'F', 'M', 'female', or 'male', got '${value}'` }
    }
}

const createAgeGroupTransformer = (): ColumnTransformer<string> => {
    return (value: string, rowNumber: number, maps: ValidationMaps) => {
        const trimmed = value.trim()
        if (!trimmed) {
            return { value: "", error: `Row ${rowNumber}: Age group ID is required` }
        }

        // First check if it's a valid ID
        if (maps.ageGroups.has(trimmed)) {
            return { value: trimmed }
        }

        // Then check if it matches a name (case-insensitive)
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

        // First check if it's a valid ID
        if (maps.categories.has(trimmed)) {
            return { value: trimmed }
        }

        // Then check if it matches a name (case-insensitive)
        const normalizedInput = trimmed.toLowerCase()
        for (const [id, name] of maps.categoryMap.entries()) {
            if (name.toLowerCase() === normalizedInput) {
                return { value: id }
            }
        }

        return { value: trimmed, error: `Row ${rowNumber}: Equipment category '${trimmed}' not found` }
    }
}

const createOptionalStringTransformer = (): ColumnTransformer<string | null> => {
    return (value: string) => {
        const trimmed = value.trim()
        return { value: trimmed || null }
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
    tournamentId: string,
    maps: ValidationMaps,
    columnTransformers: ColumnTransformer<unknown>[]
): { participant?: Omit<Participant, 'id'>; errors: ParseError[] } {
    if (row.length < columnTransformers.length) {
        return {
            errors: [{
                row: rowNumber,
                message: `Row ${rowNumber}: Expected ${columnTransformers.length} columns, found ${row.length}`
            }]
        }
    }

    const results = columnTransformers.map((transformer, index) =>
        transformer(row[index], rowNumber, maps) as { value: unknown; error?: string }
    )

    const rowErrors = results
        .filter(r => r.error)
        .map(r => ({ row: rowNumber, message: r.error! }))

    if (rowErrors.length > 0) {
        return { errors: rowErrors }
    }

    return {
        participant: {
            tournamentId,
            name: results[0].value as string,
            membershipNo: results[1].value as string,
            genderGroup: results[2].value as GenderGroup,
            ageGroupId: results[3].value as string,
            categoryId: results[4].value as string,
            club: results[5].value as string | null,
            checkedIn: false
        },
        errors: []
    }
}

export async function parseCSV(csvText: string, tournamentId: string, maps: ValidationMaps): Promise<ParseResult> {
    const participants: Omit<Participant, 'id'>[] = []
    const errors: ParseError[] = []
    let rowNumber = 0
    const columnTransformers = createColumnTransformers()

    Papa.parse<string[]>(csvText, {
        skipEmptyLines: true,
        header: false,
        step: (result) => {
            rowNumber++
            const { participant, errors: rowErrors } = processRow(result.data, rowNumber, tournamentId, maps, columnTransformers)
            errors.push(...rowErrors)
            if (participant) {
                participants.push(participant)
            }
        },
        complete: (results) => {
            if (results.errors.length > 0) {
                errors.push(...results.errors.map(e => ({
                    row: e.row !== undefined ? e.row + 1 : 0,
                    message: `CSV parsing error: ${e.message}`
                })))
            }
        },
        error: (error: Error) => {
            errors.push({ row: 0, message: `CSV parsing error: ${error.message}` })
        }
    })

    return { participants, errors }
}

async function fetchValidationMaps(): Promise<ValidationMaps> {
    const prisma = prismaOrThrow("fetch validation maps")

    const [ageGroups, categories] = await Promise.all([
        prisma.ageGroup.findMany({ select: { id: true, name: true } }),
        prisma.equipmentCategory.findMany({ select: { id: true, name: true } })
    ])

    const ageGroupMap = new Map<string, string>()
    const categoryMap = new Map<string, string>()

    ageGroups.forEach(ag => {
        ageGroupMap.set(ag.id, ag.name)
    })

    categories.forEach(cat => {
        categoryMap.set(cat.id, cat.name)
    })

    return {
        ageGroups: new Set(ageGroups.map(ag => ag.id)),
        categories: new Set(categories.map(cat => cat.id)),
        ageGroupMap,
        categoryMap
    }
}

async function insertParticipants(
    participants: Omit<Participant, 'id'>[]
): Promise<number> {
    const prisma = prismaOrThrow("insert participants")

    await prisma.participant.createMany({
        data: participants
    })

    return participants.length
}

function validateFormData(fd: FormData): { valid: boolean; tournamentId?: string; csvText?: string; error?: CSVImportState } {
    const tournamentId = fd.get('tId') as string
    const csvText = fd.get('csvText') as string

    if (!tournamentId) {
        return {
            valid: false,
            error: {
                success: false,
                message: "Tournament ID is required",
                importedCount: 0,
                errors: ["Tournament ID not found"]
            }
        }
    }

    if (!csvText) {
        return {
            valid: false,
            error: {
                success: false,
                message: "CSV data is required",
                importedCount: 0,
                errors: ["CSV data not found"]
            }
        }
    }

    return { valid: true, tournamentId, csvText }
}

function handleParseErrors(parseErrors: ParseError[]): CSVImportState | null {
    if (parseErrors.length > 0) {
        return {
            success: false,
            message: `CSV parsing failed with ${parseErrors.length} error(s)`,
            importedCount: 0,
            errors: parseErrors.map(e => e.message)
        }
    }
    return null
}

function handleEmptyParticipants(): CSVImportState {
    return {
        success: false,
        message: "No valid data found in CSV file",
        importedCount: 0,
        errors: ["CSV file appears to be empty or invalid"]
    }
}

function formatPrismaError(error: unknown): string {
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; meta?: { target?: string[] }; message: string }

        // Handle unique constraint violations
        if (prismaError.code === 'P2002') {
            const field = prismaError.meta?.target?.join(', ') || 'field'
            return `Duplicate entry: A participant with same value of (${field}) already exists in this tournament`
        }

        // Handle foreign key constraint violations
        if (prismaError.code === 'P2003') {
            return `Invalid reference: The referenced record does not exist`
        }

        // Return the Prisma message if available
        if (prismaError.message) {
            return prismaError.message
        }
    }

    // Fallback to standard error handling
    if (error instanceof Error) {
        return error.message
    }

    return 'Unknown error occurred during import'
}

export async function importParticipantsCSV(
    initialState: CSVImportState,
    fd: FormData
): Promise<CSVImportState> {
    try {
        const formValidation = validateFormData(fd)
        if (!formValidation.valid) {
            return formValidation.error!
        }

        const maps = await fetchValidationMaps()
        const { participants, errors: parseErrors } = await parseCSV(formValidation.csvText!, formValidation.tournamentId!, maps)

        const parseErrorResult = handleParseErrors(parseErrors)
        if (parseErrorResult) {
            return parseErrorResult
        }

        if (participants.length === 0) {
            return handleEmptyParticipants()
        }

        try {
            const count = await insertParticipants(participants)
            revalidatePath(`/tournaments/${formValidation.tournamentId!}`, 'page')
            return {
                success: true,
                message: `Successfully imported ${count} participants`,
                importedCount: count,
                errors: []
            }
        } catch (error) {
            console.error("Failed to insert participants:", error)
            const errorMessage = formatPrismaError(error)
            return {
                success: false,
                message: `Import failed: ${errorMessage}`,
                importedCount: 0,
                errors: [errorMessage]
            }
        }

    } catch (error) {
        console.error("Failed to import participants CSV:", error)
        const errorMessage = formatPrismaError(error)
        return {
            success: false,
            message: `Import failed: ${errorMessage}`,
            importedCount: 0,
            errors: [errorMessage]
        }
    }
}
