"use server"

import { Participant } from "@/generated/prisma/client"
import { prismaOrThrow } from "@/lib/prisma"
import {
    CSVImportState,
    fetchParticipantValidationMaps,
    formatImportPrismaError,
    parseErrorsToImportState,
    parseParticipantCsv,
    type ValidationMaps,
} from "@/lib/participantCsvImport"
import { revalidatePath } from "next/cache"

export type { CSVImportState, ValidationMaps }

export async function parseCSV(csvText: string, tournamentId: string, maps: ValidationMaps) {
    const { profiles, errors } = await parseParticipantCsv(csvText, maps)

    return {
        participants: profiles.map((profile) => ({
            tournamentId,
            name: profile.name,
            membershipNo: profile.membershipNo,
            competitorNumber: null,
            genderGroup: profile.genderGroup,
            ageGroupId: profile.ageGroupId,
            categoryId: profile.categoryId,
            club: profile.club.trim() || null,
            checkedIn: false,
        })) satisfies Omit<Participant, "id">[],
        errors,
    }
}

async function insertParticipants(participants: Omit<Participant, "id">[]): Promise<number> {
    const prisma = prismaOrThrow("insert participants")

    await prisma.participant.createMany({
        data: participants,
    })

    return participants.length
}

function validateFormData(fd: FormData): { valid: boolean; tournamentId?: string; csvText?: string; error?: CSVImportState } {
    const tournamentId = fd.get("tId") as string
    const csvText = fd.get("csvText") as string

    if (!tournamentId) {
        return {
            valid: false,
            error: {
                success: false,
                message: "Tournament ID is required",
                importedCount: 0,
                errors: ["Tournament ID not found"],
            },
        }
    }

    if (!csvText) {
        return {
            valid: false,
            error: {
                success: false,
                message: "CSV data is required",
                importedCount: 0,
                errors: ["CSV data not found"],
            },
        }
    }

    return { valid: true, tournamentId, csvText }
}

export async function importParticipantsCSV(
    _initialState: CSVImportState,
    fd: FormData
): Promise<CSVImportState> {
    try {
        const formValidation = validateFormData(fd)
        if (!formValidation.valid) {
            return formValidation.error!
        }

        const maps = await fetchParticipantValidationMaps()
        const { participants, errors: parseErrors } = await parseCSV(
            formValidation.csvText!,
            formValidation.tournamentId!,
            maps
        )

        if (parseErrors.length > 0) {
            return parseErrorsToImportState(parseErrors)
        }

        if (participants.length === 0) {
            return {
                success: false,
                message: "No valid data found in CSV file",
                importedCount: 0,
                errors: ["CSV file appears to be empty or invalid"],
            }
        }

        try {
            const count = await insertParticipants(participants)
            revalidatePath(`/tournaments/${formValidation.tournamentId!}`, "page")
            return {
                success: true,
                message: `Successfully imported ${count} participants`,
                importedCount: count,
                errors: [],
            }
        } catch (error) {
            console.error("Failed to insert participants:", error)
            const errorMessage = formatImportPrismaError(error)
            return {
                success: false,
                message: `Import failed: ${errorMessage}`,
                importedCount: 0,
                errors: [errorMessage],
            }
        }
    } catch (error) {
        console.error("Failed to import participants CSV:", error)
        const errorMessage = formatImportPrismaError(error)
        return {
            success: false,
            message: `Import failed: ${errorMessage}`,
            importedCount: 0,
            errors: [errorMessage],
        }
    }
}
