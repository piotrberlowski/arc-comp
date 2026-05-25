"use server"

import type { ParticipantProfileInput } from "@/lib/participantProfileSchema"
import {
    CSVImportState,
    fetchParticipantValidationMaps,
    formatImportPrismaError,
    parseErrorsToImportState,
    parseParticipantCsv,
} from "@/lib/participantCsvImport"
import { prismaOrThrow } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { assertChampionshipWritable } from "../championshipActions"

function validateChampionshipClubRows(profiles: ParticipantProfileInput[]): CSVImportState | null {
    const errors = profiles.flatMap((profile, index) =>
        profile.club.trim() ? [] : [`Row ${index + 1}: Club is required`]
    )

    if (errors.length === 0) {
        return null
    }

    return {
        success: false,
        message: `CSV parsing failed with ${errors.length} error(s)`,
        importedCount: 0,
        errors,
    }
}

function registrationRowsFromProfiles(
    championshipId: string,
    profiles: ParticipantProfileInput[],
    firstCompetitorNumber: number
) {
    let nextCompetitorNumber = firstCompetitorNumber

    return profiles.map((profile) => {
        const row = {
            championshipId,
            name: profile.name.trim(),
            membershipNo: profile.membershipNo.trim(),
            ageGroupId: profile.ageGroupId,
            categoryId: profile.categoryId,
            club: profile.club.trim(),
            genderGroup: profile.genderGroup,
            competitorNumber: nextCompetitorNumber,
        }
        nextCompetitorNumber += 1
        return row
    })
}

async function insertChampionshipRegistrations(
    championshipId: string,
    profiles: ParticipantProfileInput[]
): Promise<number> {
    await assertChampionshipWritable(championshipId)

    const prisma = prismaOrThrow("import championship registrations")

    await prisma.$transaction(
        async (tx) => {
            const currentMax = await tx.championshipRegistration.aggregate({
                where: { championshipId },
                _max: { competitorNumber: true },
            })

            const firstCompetitorNumber = (currentMax._max.competitorNumber ?? 0) + 1
            const data = registrationRowsFromProfiles(championshipId, profiles, firstCompetitorNumber)

            await tx.championshipRegistration.createMany({ data })
        },
        { timeout: 60_000, maxWait: 10_000 }
    )

    return profiles.length
}

export async function importChampionshipRegistrationsCSV(
    _initialState: CSVImportState,
    fd: FormData
): Promise<CSVImportState> {
    const championshipId = fd.get("championshipId")
    const csvText = fd.get("csvText")

    if (typeof championshipId !== "string" || !championshipId) {
        return {
            success: false,
            message: "Championship ID is required",
            importedCount: 0,
            errors: ["Championship ID not found"],
        }
    }

    if (typeof csvText !== "string" || !csvText) {
        return {
            success: false,
            message: "CSV data is required",
            importedCount: 0,
            errors: ["CSV data not found"],
        }
    }

    try {
        const maps = await fetchParticipantValidationMaps()
        const { profiles, errors: parseErrors } = await parseParticipantCsv(csvText, maps)

        if (parseErrors.length > 0) {
            return parseErrorsToImportState(parseErrors)
        }

        const clubErrors = validateChampionshipClubRows(profiles)
        if (clubErrors) {
            return clubErrors
        }

        if (profiles.length === 0) {
            return {
                success: false,
                message: "No valid data found in CSV file",
                importedCount: 0,
                errors: ["CSV file appears to be empty or invalid"],
            }
        }

        const count = await insertChampionshipRegistrations(championshipId, profiles)
        revalidatePath(`/championships/${championshipId}`)

        return {
            success: true,
            message: `Successfully imported ${count} competitors`,
            importedCount: count,
            errors: [],
        }
    } catch (error) {
        console.error("Failed to import championship registrations CSV:", error)
        const errorMessage = formatImportPrismaError(error)
        return {
            success: false,
            message: `Import failed: ${errorMessage}`,
            importedCount: 0,
            errors: [errorMessage],
        }
    }
}
