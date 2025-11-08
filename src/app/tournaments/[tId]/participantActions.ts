"use server"

import { revalidatePath } from "next/cache"
import { redirect, RedirectType } from "next/navigation"
import { z } from "zod"
import { zu } from 'zod_utilz'
import { prismaOrThrow } from "../../../../lib/prisma"

const participantSubmitSchema = z.object({
    tournamentId: z.string().nonempty(),
    name: z.string().min(3, "Name must be at least 3 characters long"),
    membershipNo: z.string().nonempty("Membership number is required"),
    genderGroup: z.union([
        z.literal("F"),
        z.literal("M"),
    ]),
    ageGroupId: z.string().nonempty("Age Division must be selected"),
    categoryId: z.string().nonempty("Equipment Category must be selected"),
    club: z.string(),
    checkedIn: z.boolean().default(false),
})

export interface AddParticipantState {

    data?: {
        name?: string
        membershipNo?: string
        genderGroup?: "F" | "M"
        ageGroupId?: string
        categoryId?: string
        club?: string
        checkedIn?: boolean
    }
    errors: Record<string, string>

}

export async function addParticipant(initialState: AddParticipantState, fd: FormData): Promise<AddParticipantState> {

    const checkedInValue = fd.get('checkedIn')
    const checkedIn = checkedInValue === 'true'

    const fdConstructed = {
        tournamentId: fd.get('tId'),
        name: fd.get('name'),
        membershipNo: fd.get('membershipNo'),
        genderGroup: fd.get('genderGroup'),
        ageGroupId: fd.get('ageGroupId'),
        categoryId: fd.get('categoryId'),
        club: fd.get('club'),
        checkedIn
    }

    const participant = zu.partialSafeParse(participantSubmitSchema, fdConstructed)

    if (!participant.success || participant.successType !== "full") {
        return {
            data: participant.validData,
            errors: participant.error?.flatten().fieldErrors || {}
        }
    }

    const fullParse = participantSubmitSchema.parse(fdConstructed)
    console.log(JSON.stringify(fullParse))
    return prismaOrThrow("add participant")
        .participant
        .create({
            data: fullParse
        })
        .then((p) => {
            revalidatePath(`/tournaments/[tId]`, 'page')
            redirect(`/tournaments/${p.tournamentId}`, RedirectType.replace)
        }, e => {
            return {
                data: fullParse,
                errors: e
            }
        })
}

export async function listParticipants(tId: string) {
    return prismaOrThrow("list participants").participant.findMany({
        where: {
            tournamentId: tId
        }
    })

}

export async function removeParticipant(initialState: string) {
    return prismaOrThrow("remove participant").participant.delete({
        where: {
            id: initialState
        }
    }).then((p) => {
        revalidatePath(`tournaments/${p.tournamentId}`)
    })
}

export async function checkInParticipant(participantId: string): Promise<void> {
    const participant = await prismaOrThrow("check in participant").participant.update({
        where: { id: participantId },
        data: { checkedIn: true }
    })
    revalidatePath(`/tournaments/[tId]`, 'page')
    revalidatePath(`/tournaments/${participant.tournamentId}/groups`, 'page')
}

export async function uncheckParticipant(participantId: string): Promise<void> {
    const participant = await prismaOrThrow("get participant for uncheck").participant.findUnique({
        where: { id: participantId },
        include: { groupAssignment: true }
    })

    if (!participant) {
        throw new Error("Participant not found")
    }

    // Remove group assignment if participant is in a group
    if (participant.groupAssignment) {
        await prismaOrThrow("remove group assignment on uncheck").groupAssignment.delete({
            where: {
                participantId_tournamentId: {
                    participantId,
                    tournamentId: participant.tournamentId
                }
            }
        })
    }

    await prismaOrThrow("uncheck participant").participant.update({
        where: { id: participantId },
        data: { checkedIn: false }
    })

    revalidatePath(`/tournaments/[tId]`, 'page')
    revalidatePath(`/tournaments/${participant.tournamentId}/groups`, 'page')
}

// CSV Import functionality
export interface CSVImportState {
    success: boolean
    message: string
    importedCount: number
    errors: string[]
}

export interface CSVRow {
    fullName: string
    memberNo: string
    gender: string
    ageGroup: string
    equipmentCategory: string
    clubName: string
}

export async function importParticipantsCSV(
    initialState: CSVImportState,
    fd: FormData
): Promise<CSVImportState> {
    try {
        const tournamentId = fd.get('tId') as string
        const csvText = fd.get('csvText') as string

        if (!tournamentId) {
            return {
                success: false,
                message: "Tournament ID is required",
                importedCount: 0,
                errors: ["Tournament ID not found"]
            }
        }

        if (!csvText) {
            return {
                success: false,
                message: "CSV data is required",
                importedCount: 0,
                errors: ["CSV data not found"]
            }
        }

        // Parse CSV on server side
        const parseCSV = (csvText: string): CSVRow[] => {
            const lines = csvText.split('\n').filter(line => line.trim())
            const rows: CSVRow[] = []

            for (const line of lines) {
                // Simple CSV parsing that handles quoted fields
                const fields = []
                let current = ''
                let inQuotes = false

                for (let i = 0; i < line.length; i++) {
                    const char = line[i]

                    if (char === '"') {
                        inQuotes = !inQuotes
                    } else if (char === ',' && !inQuotes) {
                        fields.push(current.trim())
                        current = ''
                    } else {
                        current += char
                    }
                }
                fields.push(current.trim())

                if (fields.length >= 6) {
                    rows.push({
                        fullName: fields[0].replace(/"/g, ''),
                        memberNo: fields[1].replace(/"/g, ''),
                        gender: fields[2].replace(/"/g, ''),
                        ageGroup: fields[3].replace(/"/g, ''),
                        equipmentCategory: fields[4].replace(/"/g, ''),
                        clubName: fields[5].replace(/"/g, '')
                    })
                }
            }

            return rows
        }

        const csvData = parseCSV(csvText)

        if (csvData.length === 0) {
            return {
                success: false,
                message: "No valid data found in CSV file",
                importedCount: 0,
                errors: ["CSV file appears to be empty or invalid"]
            }
        }

        // Validate all rows first (all or nothing)
        const validatedRows = []
        const errors: string[] = []

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i]
            const rowNumber = i + 1

            // Validate required fields
            if (!row.fullName?.trim()) {
                errors.push(`Row ${rowNumber}: Full name is required`)
                continue
            }
            if (!row.memberNo?.trim()) {
                errors.push(`Row ${rowNumber}: Membership number is required`)
                continue
            }
            if (!row.gender?.trim()) {
                errors.push(`Row ${rowNumber}: Gender is required`)
                continue
            }
            if (!row.ageGroup?.trim()) {
                errors.push(`Row ${rowNumber}: Age group is required`)
                continue
            }
            if (!row.equipmentCategory?.trim()) {
                errors.push(`Row ${rowNumber}: Equipment category is required`)
                continue
            }

            // Validate gender
            const gender = row.gender.trim().toUpperCase()
            if (gender !== 'F' && gender !== 'M') {
                errors.push(`Row ${rowNumber}: Gender must be 'F' or 'M', got '${row.gender}'`)
                continue
            }

            // Check if age group and equipment category exist
            const ageGroup = await prismaOrThrow("check age group").ageGroup.findUnique({
                where: { id: row.ageGroup.trim() }
            })
            if (!ageGroup) {
                errors.push(`Row ${rowNumber}: Age group '${row.ageGroup}' not found`)
                continue
            }

            const equipmentCategory = await prismaOrThrow("check equipment category").equipmentCategory.findUnique({
                where: { id: row.equipmentCategory.trim() }
            })
            if (!equipmentCategory) {
                errors.push(`Row ${rowNumber}: Equipment category '${row.equipmentCategory}' not found`)
                continue
            }

            // Check for duplicate membership numbers in the same tournament
            const existingParticipant = await prismaOrThrow("check duplicate").participant.findUnique({
                where: {
                    tournamentId_membershipNo: {
                        tournamentId,
                        membershipNo: row.memberNo.trim()
                    }
                }
            })
            if (existingParticipant) {
                errors.push(`Row ${rowNumber}: Participant with membership number '${row.memberNo}' already exists in this tournament`)
                continue
            }

            validatedRows.push({
                tournamentId,
                name: row.fullName.trim(),
                membershipNo: row.memberNo.trim(),
                genderGroup: gender as 'F' | 'M',
                ageGroupId: row.ageGroup.trim(),
                categoryId: row.equipmentCategory.trim(),
                club: row.clubName?.trim() || null,
                checkedIn: false
            })
        }

        // If there are validation errors, return them
        if (errors.length > 0) {
            return {
                success: false,
                message: `Validation failed with ${errors.length} error(s)`,
                importedCount: 0,
                errors
            }
        }

        // If all validations pass, create all participants in a transaction
        await prismaOrThrow("import participants").$transaction(
            validatedRows.map(row =>
                prismaOrThrow("create participant").participant.create({
                    data: row
                })
            )
        )

        revalidatePath(`/tournaments/${tournamentId}`, 'page')

        return {
            success: true,
            message: `Successfully imported ${validatedRows.length} participants`,
            importedCount: validatedRows.length,
            errors: []
        }

    } catch (error) {
        return {
            success: false,
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            importedCount: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
        }
    }
}