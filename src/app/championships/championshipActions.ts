"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@/generated/prisma/client"
import {
    buildDivisionRangeMatrixFromShell,
    type DivisionRangeMatrixData,
    type DivisionRangeMatrixRow,
} from "@/lib/championshipDivisionRangeMatrix"
import { championshipDayTournamentName, nextChampionshipDayOrder } from "@/lib/championshipDayNaming"
import {
    areChampionshipRangeAssignmentsComplete,
    buildEnrollmentByMembership,
    filterMembershipNosEligibleOnDay,
    participantDataFromRegistration,
    participantUpdateFromRegistration,
} from "@/lib/championshipEnrollment"
import type { EnrollChampionshipDayResult } from "@/lib/championshipEnrollmentMessages"
import {
    findDivisionRangeAssignment,
    findDivisionRangeOnOtherDay,
    mapDivisionRangeAssignments,
    resolveDivisionRangeForDay,
    isDayOneRangeAssignmentFrozen,
    type ChampionshipDivisionRangeRow,
    type RangeAssignmentUpdate,
} from "@/lib/championshipRangeRules"
import { assertChampionshipOrganizerClubs, resolveChampionshipOrganizerClubs } from "@/lib/championshipOrganizerSession"
import {
    type ChampionshipCombinedStandings,
} from "@/lib/championshipCombinedStandings"
import {
    buildChampionshipCombinedStandingsFromChampionshipData,
    buildCompetitorStandingsByCategoryFromChampionshipData,
} from "@/lib/championshipStandingsInput"
import {
    assertAutoSeedPlanIsComplete,
    buildTournamentAutoSeedPlan,
    participantAllowedOnRangeForDay,
    validateAutoSeedTargetRange,
    type AutoSeedTargetRange,
} from "@/lib/championshipAutoSeed"
import { createGroupAssignments, mapSeedAssignmentsToCreateRows } from "@/lib/groupAssignmentCreate"
import { prismaOrThrow } from "@/lib/prisma"
import {
    aggregateSharingOption,
    type SharingOption,
} from "@/lib/tournamentSharing"

export interface ChampionshipRangeFormatInput {
    rangeNumber: number
    formatId: string
}

export interface ChampionshipCreateInput {
    name: string
    organizerClub: string
    rangeCount?: number
    rangeFormats: ChampionshipRangeFormatInput[]
}

export interface ChampionshipUpdateInput {
    name?: string
}

export interface CreateRoundTournamentInput {
    championshipId: string
    dayOrder: number
    tournamentId: string
    label?: string
}

export interface AddChampionshipDayInput {
    championshipId: string
    name: string
    date: Date
    formatId?: string
    endCount?: number
    groupSize?: number
}

type RangeTournamentConfig = {
    rangeNumber: number
    formatId: string
    endCount: number
    groupSize: number
}

function resolveRangeTournamentConfigs(
    championship: ChampionshipShellRow,
    legacy?: { formatId: string; endCount: number; groupSize: number }
): RangeTournamentConfig[] {
    const rangeConfigs = championship.rangeConfigs ?? []
    if (rangeConfigs.length > 0) {
        return [...rangeConfigs]
            .sort((a, b) => a.rangeNumber - b.rangeNumber)
            .map((rangeConfig) => ({
                rangeNumber: rangeConfig.rangeNumber,
                formatId: rangeConfig.formatId,
                endCount: rangeConfig.format.endCount,
                groupSize: rangeConfig.format.groupSize,
            }))
    }

    if (!legacy?.formatId) {
        throw new Error("Round type must be configured for each range before adding a day")
    }

    return Array.from({ length: championship.rangeCount }, (_, index) => ({
        rangeNumber: index + 1,
        formatId: legacy.formatId,
        endCount: legacy.endCount,
        groupSize: legacy.groupSize,
    }))
}

async function syncDayTournamentNamesForChampionship(
    tx: Prisma.TransactionClient,
    championshipId: string,
    championshipName: string
) {
    const championship = await tx.championship.findUnique({
        where: { id: championshipId },
        select: { rangeCount: true },
    })
    const rangeCount = championship?.rangeCount ?? 1

    const roundRows = await tx.championshipRound.findMany({
        where: { championshipId },
        select: { dayOrder: true, rangeNumber: true, tournamentId: true },
    })

    for (const round of roundRows) {
        await tx.tournament.update({
            where: { id: round.tournamentId },
            data: {
                name: championshipDayTournamentName(
                    championshipName,
                    round.dayOrder,
                    round.rangeNumber,
                    rangeCount
                ),
            },
        })
    }
}

export interface RegisterChampionshipParticipantInput {
    championshipId: string
    name: string
    membershipNo: string
    ageGroupId: string
    categoryId: string
    club: string
    genderGroup: "F" | "M"
}

function isUniqueError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
    )
}

function logAndReturnNull<T>(context: string, error: unknown): T | null {
    console.error(`${context}:`, error)
    return null
}

const championshipShellInclude = {
    rounds: {
        include: {
            tournament: {
                include: {
                    format: true,
                    _count: {
                        select: { participantScores: true },
                    },
                },
            },
        },
        orderBy: [{ dayOrder: "asc" as const }, { rangeNumber: "asc" as const }],
    },
    divisionRanges: true,
    rangeConfigs: {
        include: { format: true },
        orderBy: { rangeNumber: "asc" as const },
    },
    registrations: {
        orderBy: { competitorNumber: "asc" as const },
        include: {
            ageGroup: true,
            category: true,
        },
    },
    _count: {
        select: { registrations: true },
    },
} satisfies Prisma.ChampionshipInclude

export type ChampionshipShellRow = Prisma.ChampionshipGetPayload<{
    include: typeof championshipShellInclude
}>

function getUniqueConstraintFields(error: unknown): string[] {
    if (typeof error !== "object" || error === null || !("meta" in error)) {
        return []
    }

    const meta = (error as { meta?: { target?: unknown } }).meta
    if (!meta || !Array.isArray(meta.target)) {
        return []
    }

    return meta.target.filter((field): field is string => typeof field === "string")
}

export async function createChampionship(input: ChampionshipCreateInput) {
    const clubs = await assertChampionshipOrganizerClubs()
    if (!clubs.includes(input.organizerClub)) {
        throw new Error("Unauthorized")
    }

    const rangeCount = Math.max(1, input.rangeCount ?? 1)

    if (input.rangeFormats.length !== rangeCount) {
        throw new Error("Each range must have a round type selected")
    }

    const missingFormat = input.rangeFormats.find((row) => !row.formatId.trim())
    if (missingFormat) {
        throw new Error(`Range ${missingFormat.rangeNumber} must have a round type selected`)
    }

    return prismaOrThrow("create championship").$transaction(async (tx) => {
        const championship = await tx.championship.create({
            data: {
                name: input.name,
                organizerClub: input.organizerClub,
                rangeCount,
            },
        })

        for (const row of input.rangeFormats) {
            await tx.championshipRange.create({
                data: {
                    championshipId: championship.id,
                    rangeNumber: row.rangeNumber,
                    formatId: row.formatId,
                },
            })
        }

        return championship
    }).catch((error) => {
        console.error("Failed to create championship:", error)
        throw new Error("Unable to create championship")
    })
}

export async function updateChampionship(championshipId: string, input: ChampionshipUpdateInput) {
    const clubs = await assertChampionshipOrganizerClubs()
    const existing = await getChampionshipForOrganizer(championshipId, clubs)
    if (!existing) {
        throw new Error("Unauthorized")
    }

    if (existing.isArchive) {
        throw new Error("Championship is archived")
    }

    if (input.name === undefined) {
        return prismaOrThrow("update championship").championship.update({
            where: { id: championshipId },
            data: input,
        }).catch((error) => {
            console.error("Failed to update championship:", error)
            throw new Error("Unable to update championship")
        })
    }

    const trimmedName = input.name.trim()

    return prismaOrThrow("update championship").$transaction(async (tx) => {
        const championship = await tx.championship.update({
            where: { id: championshipId },
            data: { name: trimmedName },
        })
        await syncDayTournamentNamesForChampionship(tx, championshipId, trimmedName)
        return championship
    }).catch((error) => {
        console.error("Failed to update championship:", error)
        throw new Error("Unable to update championship")
    })
}

export async function listMyChampionships(includeArchive = false): Promise<ChampionshipShellRow[] | null> {
    const clubs = await resolveChampionshipOrganizerClubs()
    if (!clubs) {
        return null
    }

    return listMyChampionshipsForClubs(clubs, includeArchive)
}

export async function listMyChampionshipsForClubs(
    clubs: string[],
    includeArchive: boolean
): Promise<ChampionshipShellRow[] | null> {
    const isArchive: boolean | undefined = includeArchive ? undefined : false

    return prismaOrThrow("list championships").championship.findMany({
        where: {
            organizerClub: {
                in: clubs,
            },
            isArchive,
        },
        include: championshipShellInclude,
        orderBy: {
            updatedAt: "desc",
        },
    }).catch((error) => logAndReturnNull<ChampionshipShellRow[]>("Failed to list championships", error))
}

export async function getChampionshipForOrganizer(
    championshipId: string,
    organizerClubs: string[]
): Promise<ChampionshipShellRow | null> {
    if (organizerClubs.length === 0) {
        return null
    }

    return prismaOrThrow("get championship for organizer").championship.findFirst({
        where: {
            id: championshipId,
            organizerClub: { in: organizerClubs },
        },
        include: championshipShellInclude,
    }).catch((error) => logAndReturnNull<ChampionshipShellRow>("Failed to load championship", error))
}

export async function listChampionshipDayTournaments(championshipId: string, organizerClubs: string[]) {
    return listChampionshipDayTournamentsForClubs(championshipId, organizerClubs)
}

export async function listChampionshipDayTournamentsForClubs(championshipId: string, organizerClubs: string[]) {
    return prismaOrThrow("list championship day tournaments").championshipRound.findMany({
        where: {
            championshipId,
            championship: {
                organizerClub: { in: organizerClubs },
            },
        },
        include: {
            tournament: {
                include: { format: true },
            },
        },
        orderBy: { dayOrder: "asc" },
    }).catch((error) => logAndReturnNull("Failed to list championship day tournaments", error))
}

async function assertChampionshipAccessForId(championshipId: string): Promise<void> {
    const clubs = await assertChampionshipOrganizerClubs()
    const championship = await getChampionshipForOrganizer(championshipId, clubs)
    if (!championship) {
        throw new Error("Unauthorized")
    }
}

export async function assertChampionshipWritable(championshipId: string): Promise<void> {
    const clubs = await assertChampionshipOrganizerClubs()
    const championship = await getChampionshipForOrganizer(championshipId, clubs)
    if (!championship) {
        throw new Error("Unauthorized")
    }
    if (championship.isArchive) {
        throw new Error("Championship is archived")
    }
}

export async function addChampionshipDay(input: AddChampionshipDayInput) {
    const clubs = await assertChampionshipOrganizerClubs()
    const championship = await getChampionshipForOrganizer(input.championshipId, clubs)
    if (!championship) {
        throw new Error("Unauthorized")
    }

    if (championship.isArchive) {
        throw new Error("Championship is archived")
    }

    const dayOrder = nextChampionshipDayOrder(championship.rounds)
    const rangeTournaments = resolveRangeTournamentConfigs(
        championship,
        input.formatId && input.endCount !== undefined && input.groupSize !== undefined
            ? {
                  formatId: input.formatId,
                  endCount: input.endCount,
                  groupSize: input.groupSize,
              }
            : undefined
    )

    if (rangeTournaments.length !== championship.rangeCount) {
        throw new Error("Round type must be configured for each range before adding a day")
    }

    return prismaOrThrow("add championship day").$transaction(async (tx) => {
        const firstRound = await createChampionshipDayRangeTournaments(tx, {
            championshipId: input.championshipId,
            championshipName: championship.name,
            organizerClub: championship.organizerClub,
            rangeCount: championship.rangeCount,
            dayOrder,
            date: input.date,
            rangeTournaments,
        })

        return firstRound
    }).catch((error) => {
        if (isUniqueError(error)) {
            const fields = getUniqueConstraintFields(error)
            if (fields.includes("dayOrder")) {
                throw new Error("This championship day order already exists")
            }
            if (fields.includes("tournamentId")) {
                throw new Error("Tournament is already attached to a championship round")
            }
        }
        console.error("Failed to add championship day:", error)
        throw new Error("Unable to add championship day")
    })
}

export async function addRoundTournament(input: CreateRoundTournamentInput) {
    await assertChampionshipAccessForId(input.championshipId)

    return prismaOrThrow("add championship round").championshipRound.create({
        data: {
            championshipId: input.championshipId,
            dayOrder: input.dayOrder,
            tournamentId: input.tournamentId,
            label: input.label,
        },
    }).catch((error) => {
        if (isUniqueError(error)) {
            const fields = getUniqueConstraintFields(error)
            if (fields.includes("dayOrder")) {
                throw new Error("This championship day order already exists")
            }
            if (fields.includes("tournamentId")) {
                throw new Error("Tournament is already attached to a championship round")
            }
        }
        console.error("Failed to add championship round:", error)
        throw new Error("Unable to add championship round")
    })
}

export async function removeRound(championshipId: string, dayOrder: number) {
    return removeChampionshipDay(championshipId, dayOrder)
}

export async function removeChampionshipDay(championshipId: string, dayOrder: number) {
    const clubs = await assertChampionshipOrganizerClubs()
    const championship = await getChampionshipForOrganizer(championshipId, clubs)
    if (!championship) {
        throw new Error("Unauthorized")
    }

    if (championship.isArchive) {
        throw new Error("Championship is archived")
    }

    const dayRounds = championship.rounds.filter((item) => item.dayOrder === dayOrder)
    if (dayRounds.length === 0) {
        throw new Error("Championship day not found")
    }

    const hasScores = dayRounds.some((round) => round.tournament._count.participantScores > 0)
    if (hasScores) {
        throw new Error("Cannot remove a day after scores have been entered")
    }

    return prismaOrThrow("remove championship day").$transaction(async (tx) => {
        const tournamentIds = dayRounds.map((round) => round.tournamentId)
        await tx.participant.deleteMany({
            where: { tournamentId: { in: tournamentIds } },
        })
        await tx.championshipRound.deleteMany({
            where: { championshipId, dayOrder },
        })
        await tx.championshipDivisionRange.deleteMany({
            where: { championshipId, dayOrder },
        })
        await tx.tournament.deleteMany({
            where: { id: { in: tournamentIds } },
        })
    }).catch((error) => {
        console.error("Failed to remove championship day:", error)
        throw new Error("Unable to remove championship day")
    })
}

export async function reorderRounds(championshipId: string, orderedRoundIds: string[]) {
    await assertChampionshipAccessForId(championshipId)

    const uniqueRoundIds = new Set(orderedRoundIds)
    if (uniqueRoundIds.size !== orderedRoundIds.length) {
        throw new Error("Duplicate round IDs are not allowed in reorder input")
    }

    const totalRounds = await prismaOrThrow("count championship rounds").championshipRound.count({
        where: { championshipId },
    })
    if (orderedRoundIds.length !== totalRounds) {
        throw new Error("Reorder input must include all championship rounds")
    }

    const rounds = await prismaOrThrow("validate championship rounds").championshipRound.findMany({
        where: {
            championshipId,
            id: { in: orderedRoundIds },
        },
        select: { id: true },
    })

    if (rounds.length !== orderedRoundIds.length) {
        throw new Error("Invalid round set for championship reorder")
    }

    return prismaOrThrow("reorder championship rounds").$transaction(
        orderedRoundIds.map((roundId, index) =>
            prismaOrThrow("reorder championship rounds item").championshipRound.update({
                where: { id: roundId },
                data: {
                    dayOrder: index + 1,
                },
            })
        )
    ).catch((error) => {
        console.error("Failed to reorder championship rounds:", error)
        throw new Error("Unable to reorder championship rounds")
    })
}

export async function registerChampionshipParticipant(input: RegisterChampionshipParticipantInput) {
    await assertChampionshipWritable(input.championshipId)

    const maxRetries = 5
    let attempt = 0

    while (attempt < maxRetries) {
        try {
            return await prismaOrThrow("register championship participant").$transaction(async (tx) => {
                const currentMax = await tx.championshipRegistration.aggregate({
                    where: { championshipId: input.championshipId },
                    _max: { competitorNumber: true },
                })

                const nextCompetitorNumber = (currentMax._max.competitorNumber ?? 0) + 1

                return tx.championshipRegistration.create({
                    data: {
                        championshipId: input.championshipId,
                        membershipNo: input.membershipNo.trim(),
                        competitorNumber: nextCompetitorNumber,
                        name: input.name.trim(),
                        ageGroupId: input.ageGroupId,
                        categoryId: input.categoryId,
                        club: input.club.trim(),
                        genderGroup: input.genderGroup,
                    },
                })
            }, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            }).then((registration) => {
                revalidatePath(`/championships/${input.championshipId}`)
                return registration
            })
        } catch (error) {
            if (!isUniqueError(error)) {
                throw error
            }

            const uniqueFields = getUniqueConstraintFields(error)
            if (uniqueFields.includes("membershipNo")) {
                throw new Error("This membership number is already registered in this championship")
            }

            if (!uniqueFields.includes("competitorNumber") || attempt === maxRetries - 1) {
                console.error("Failed to register championship participant:", error)
                throw error
            }

            attempt += 1
        }
    }

    throw new Error("Unable to register championship participant")
}

export async function listChampionshipEnrolledMembershipNos(
    championshipId: string,
    organizerClubs: string[]
): Promise<string[] | null> {
    const byTournament = await listChampionshipDayEnrollmentByTournament(championshipId, organizerClubs)
    if (!byTournament) {
        return null
    }

    return [...new Set(Object.values(byTournament).flat())]
}

async function listChampionshipDayEnrollmentByTournamentForChampionship(
    championship: ChampionshipShellRow
): Promise<Record<string, string[]> | null> {
    const participants = await prismaOrThrow("list championship day enrollments").participant.findMany({
        where: {
            tournament: {
                championshipRound: { championshipId: championship.id },
            },
        },
        select: { membershipNo: true, tournamentId: true },
    }).catch((error) => {
        logAndReturnNull("Failed to list day enrollments", error)
        return null
    })

    if (!participants) {
        return null
    }

    const byTournament = Object.fromEntries(
        championship.rounds.map((round) => [round.tournamentId, [] as string[]])
    )

    for (const participant of participants) {
        const membershipNos = byTournament[participant.tournamentId]
        if (membershipNos) {
            membershipNos.push(participant.membershipNo)
        }
    }

    return byTournament
}

export async function listChampionshipDayEnrollmentByTournament(
    championshipId: string,
    organizerClubs: string[]
): Promise<Record<string, string[]> | null> {
    const championship = await getChampionshipForOrganizer(championshipId, organizerClubs)
    if (!championship) {
        return null
    }

    return listChampionshipDayEnrollmentByTournamentForChampionship(championship)
}

async function listChampionshipDayScoresForChampionship(
    championship: ChampionshipShellRow
): Promise<{ tournamentId: string; membershipNo: string; rawScore: number | null }[] | null> {
    const tournamentIds = championship.rounds.map((round) => round.tournamentId)
    if (tournamentIds.length === 0) {
        return []
    }

    const participants = await prismaOrThrow("list championship day scores").participant.findMany({
        where: { tournamentId: { in: tournamentIds } },
        select: {
            membershipNo: true,
            tournamentId: true,
            participantScore: { select: { score: true } },
        },
    }).catch((error) => {
        logAndReturnNull("Failed to list championship day scores", error)
        return null
    })

    if (!participants) {
        return null
    }

    return participants.map((participant) => ({
        tournamentId: participant.tournamentId,
        membershipNo: participant.membershipNo,
        rawScore: participant.participantScore
            ? Number(participant.participantScore.score)
            : null,
    }))
}

export async function getChampionshipCombinedStandings(
    championshipId: string,
    organizerClubs: string[]
): Promise<ChampionshipCombinedStandings | null> {
    const championship = await getChampionshipForOrganizer(championshipId, organizerClubs)
    if (!championship) {
        return null
    }

    const [enrollmentByTournament, scores] = await Promise.all([
        listChampionshipDayEnrollmentByTournamentForChampionship(championship),
        listChampionshipDayScoresForChampionship(championship),
    ])

    if (!enrollmentByTournament || !scores) {
        return null
    }

    return buildChampionshipCombinedStandingsFromChampionshipData({
        registrations: championship.registrations,
        rounds: championship.rounds.map((round) => ({
            dayOrder: round.dayOrder,
            rangeNumber: round.rangeNumber,
            tournamentId: round.tournamentId,
        })),
        scores,
        enrollmentByTournament,
    })
}

export type { DivisionRangeMatrixData, DivisionRangeMatrixRow }

export async function getChampionshipDivisionRangeMatrix(
    championshipId: string
): Promise<DivisionRangeMatrixData | null> {
    const clubs = await assertChampionshipOrganizerClubs()
    const championship = await getChampionshipForOrganizer(championshipId, clubs)
    if (!championship) {
        return null
    }

    return buildDivisionRangeMatrixFromShell(championship)
}

async function unenrollDivisionFromRangeTournaments(
    tx: Prisma.TransactionClient,
    championshipId: string,
    dayOrder: number,
    rangeNumber: number,
    ageGroupId: string,
    categoryId: string,
    genderGroup: string
) {
    const round = await tx.championshipRound.findFirst({
        where: { championshipId, dayOrder, rangeNumber },
        select: { tournamentId: true },
    })
    if (!round) {
        return
    }

    await tx.participant.deleteMany({
        where: {
            tournamentId: round.tournamentId,
            ageGroupId,
            categoryId,
            genderGroup: genderGroup as "F" | "M",
        },
    })
}

function parseDivisionKey(divisionKey: string): [string, "F" | "M", string] {
    return divisionKey.split(":") as [string, "F" | "M", string]
}

function syncWorkingAssignment(
    assignments: ChampionshipDivisionRangeRow[],
    dayOrder: number,
    ageGroupId: string,
    categoryId: string,
    genderGroup: string,
    rangeNumber: number | null
) {
    const index = assignments.findIndex(
        (assignment) =>
            assignment.dayOrder === dayOrder &&
            assignment.ageGroupId === ageGroupId &&
            assignment.categoryId === categoryId &&
            assignment.genderGroup === genderGroup
    )

    if (rangeNumber === null) {
        if (index >= 0) {
            assignments.splice(index, 1)
        }
        return
    }

    if (index >= 0) {
        assignments[index] = {
            dayOrder,
            ageGroupId,
            categoryId,
            genderGroup,
            rangeNumber,
        }
        return
    }

    assignments.push({ dayOrder, ageGroupId, categoryId, genderGroup, rangeNumber })
}

function validateDivisionRangeAssignment(
    championship: ChampionshipShellRow,
    workingAssignments: ChampionshipDivisionRangeRow[],
    dayOrder: number,
    divisionKey: string,
    rangeNumber: number | null
) {
    const [ageGroupId, genderGroup, categoryId] = parseDivisionKey(divisionKey)

    if (dayOrder === 1 && isDayOneRangeAssignmentFrozen(championship.rounds)) {
        throw new Error("Day 1 category–range assignments are frozen after scores are entered")
    }

    if (rangeNumber === null) {
        return { ageGroupId, genderGroup, categoryId }
    }

    if (rangeNumber < 1 || rangeNumber > championship.rangeCount) {
        throw new Error("Invalid range number")
    }

    const conflictDayOrder = findDivisionRangeOnOtherDay(
        workingAssignments,
        dayOrder,
        ageGroupId,
        categoryId,
        genderGroup,
        rangeNumber
    )
    if (conflictDayOrder !== null) {
        throw new Error(
            `This division is already assigned to range ${rangeNumber} on day ${conflictDayOrder}`
        )
    }

    return { ageGroupId, genderGroup, categoryId }
}

async function applyDivisionRangeAssignmentInTransaction(
    tx: Prisma.TransactionClient,
    championshipId: string,
    dayOrder: number,
    ageGroupId: string,
    categoryId: string,
    genderGroup: "F" | "M",
    rangeNumber: number | null
) {
    const existing = await tx.championshipDivisionRange.findFirst({
        where: {
            championshipId,
            dayOrder,
            ageGroupId,
            categoryId,
            genderGroup,
        },
    })

    if (rangeNumber === null) {
        if (!existing) {
            return
        }

        await unenrollDivisionFromRangeTournaments(
            tx,
            championshipId,
            dayOrder,
            existing.rangeNumber,
            ageGroupId,
            categoryId,
            genderGroup
        )
        await tx.championshipDivisionRange.delete({ where: { id: existing.id } })
        return
    }

    if (existing && existing.rangeNumber !== rangeNumber) {
        await unenrollDivisionFromRangeTournaments(
            tx,
            championshipId,
            dayOrder,
            existing.rangeNumber,
            ageGroupId,
            categoryId,
            genderGroup
        )
    }

    await tx.championshipDivisionRange.upsert({
        where: {
            championshipId_dayOrder_ageGroupId_categoryId_genderGroup: {
                championshipId,
                dayOrder,
                ageGroupId,
                categoryId,
                genderGroup,
            },
        },
        create: {
            championshipId,
            dayOrder,
            ageGroupId,
            categoryId,
            genderGroup,
            rangeNumber,
        },
        update: { rangeNumber },
    })
}

export async function setChampionshipDivisionRangeAssignments(
    championshipId: string,
    updates: RangeAssignmentUpdate[]
): Promise<DivisionRangeMatrixData | null> {
    if (updates.length === 0) {
        return getChampionshipDivisionRangeMatrix(championshipId)
    }

    const championship = await getWritableChampionshipShell(championshipId)
    const workingAssignments = mapDivisionRangeAssignments(championship.divisionRanges)

    await prismaOrThrow("set championship division ranges").$transaction(async (tx) => {
        for (const update of updates) {
            const { ageGroupId, genderGroup, categoryId } = validateDivisionRangeAssignment(
                championship,
                workingAssignments,
                update.dayOrder,
                update.divisionKey,
                update.rangeNumber
            )

            await applyDivisionRangeAssignmentInTransaction(
                tx,
                championshipId,
                update.dayOrder,
                ageGroupId,
                categoryId,
                genderGroup,
                update.rangeNumber
            )
            syncWorkingAssignment(
                workingAssignments,
                update.dayOrder,
                ageGroupId,
                categoryId,
                genderGroup,
                update.rangeNumber
            )
        }
    })

    revalidatePath(`/championships/${championshipId}`)

    const refreshedRanges = await prismaOrThrow("reload championship division ranges")
        .championshipDivisionRange.findMany({
            where: { championshipId },
        })
    championship.divisionRanges = refreshedRanges

    return buildDivisionRangeMatrixFromShell(championship)
}

export async function setChampionshipDivisionRangeAssignment(
    championshipId: string,
    dayOrder: number,
    divisionKey: string,
    rangeNumber: number | null
) {
    await setChampionshipDivisionRangeAssignments(championshipId, [
        { divisionKey, dayOrder, rangeNumber },
    ])
}

async function createChampionshipDayRangeTournaments(
    tx: Prisma.TransactionClient,
    input: {
        championshipId: string
        championshipName: string
        organizerClub: string
        rangeCount: number
        dayOrder: number
        date: Date
        rangeTournaments: RangeTournamentConfig[]
    }
) {
    let firstRound: Awaited<ReturnType<typeof tx.championshipRound.create>> | null = null

    for (const rangeConfig of input.rangeTournaments) {
        const tournament = await tx.tournament.create({
            data: {
                name: championshipDayTournamentName(
                    input.championshipName,
                    input.dayOrder,
                    rangeConfig.rangeNumber,
                    input.rangeCount
                ),
                organizerClub: input.organizerClub,
                formatId: rangeConfig.formatId,
                date: input.date,
                endCount: rangeConfig.endCount,
                groupSize: rangeConfig.groupSize,
            },
        })

        const round = await tx.championshipRound.create({
            data: {
                championshipId: input.championshipId,
                dayOrder: input.dayOrder,
                rangeNumber: rangeConfig.rangeNumber,
                tournamentId: tournament.id,
            },
            include: { tournament: true },
        })

        if (!firstRound) {
            firstRound = round
        }
    }

    if (!firstRound) {
        throw new Error("Unable to create championship day tournaments")
    }

    return firstRound
}

async function getWritableChampionshipShell(championshipId: string): Promise<ChampionshipShellRow> {
    const clubs = await assertChampionshipOrganizerClubs()
    const championship = await getChampionshipForOrganizer(championshipId, clubs)
    if (!championship) {
        throw new Error("Unauthorized")
    }
    if (championship.isArchive) {
        throw new Error("Championship is archived")
    }
    return championship
}

function getChampionshipRoundByDayAndRange(
    championship: ChampionshipShellRow,
    dayOrder: number,
    rangeNumber: number
) {
    const round = championship.rounds.find(
        (item) => item.dayOrder === dayOrder && item.rangeNumber === rangeNumber
    )
    if (!round) {
        throw new Error("Championship day range not found")
    }
    return round
}

async function listPriorRangeNumbersByMembership(
    championshipId: string,
    dayOrder: number,
    membershipNos: string[]
): Promise<Map<string, Set<number>>> {
    const priorRangesByMembership = new Map<string, Set<number>>()
    if (dayOrder <= 1 || membershipNos.length === 0) {
        return priorRangesByMembership
    }

    const priorEnrollments = await prismaOrThrow("list prior range enrollments").participant.findMany({
        where: {
            membershipNo: { in: membershipNos },
            tournament: {
                championshipRound: {
                    championshipId,
                    dayOrder: { lt: dayOrder },
                },
            },
        },
        select: {
            membershipNo: true,
            tournament: {
                select: { championshipRound: { select: { rangeNumber: true } } },
            },
        },
    })

    for (const row of priorEnrollments) {
        const rangeNumber = row.tournament.championshipRound?.rangeNumber
        if (rangeNumber === undefined) {
            continue
        }
        const usedRangeNumbers = priorRangesByMembership.get(row.membershipNo) ?? new Set<number>()
        usedRangeNumbers.add(rangeNumber)
        priorRangesByMembership.set(row.membershipNo, usedRangeNumbers)
    }

    return priorRangesByMembership
}

function assertRegistrationCanEnrollOnRange(
    championship: ChampionshipShellRow,
    dayOrder: number,
    rangeNumber: number,
    registration: ChampionshipShellRow["registrations"][number],
    assignments: ChampionshipDivisionRangeRow[],
    priorRangesByMembership: Map<string, Set<number>>
) {
    let assignedRange = findDivisionRangeAssignment(
        assignments,
        dayOrder,
        registration.ageGroupId,
        registration.categoryId,
        registration.genderGroup
    )

    if (assignedRange === null && championship.rangeCount === 1) {
        assignedRange = 1
    }

    if (assignedRange === null) {
        throw new Error("This division is not assigned to a range for this day")
    }

    if (assignedRange !== rangeNumber) {
        throw new Error("This division is assigned to a different range for this day")
    }

    if (priorRangesByMembership.get(registration.membershipNo)?.has(rangeNumber)) {
        throw new Error("Competitor already shot on this range on an earlier day")
    }
}

async function assertCanEnrollOnRange(
    championship: ChampionshipShellRow,
    dayOrder: number,
    rangeNumber: number,
    registration: ChampionshipShellRow["registrations"][number]
) {
    const assignments = mapDivisionRangeAssignments(championship.divisionRanges)
    const priorRangesByMembership = await listPriorRangeNumbersByMembership(
        championship.id,
        dayOrder,
        [registration.membershipNo]
    )
    assertRegistrationCanEnrollOnRange(
        championship,
        dayOrder,
        rangeNumber,
        registration,
        assignments,
        priorRangesByMembership
    )
}

function resolveEnrollmentRangeForRegistration(
    championship: ChampionshipShellRow,
    dayOrder: number,
    registration: ChampionshipShellRow["registrations"][number]
): number {
    const rangeNumber = resolveDivisionRangeForDay(
        mapDivisionRangeAssignments(championship.divisionRanges),
        championship.rangeCount,
        dayOrder,
        registration.ageGroupId,
        registration.categoryId,
        registration.genderGroup
    )
    if (rangeNumber === null) {
        throw new Error("This division is not assigned to a range for this day")
    }
    return rangeNumber
}

export async function enrollChampionshipCompetitorsOnDay(
    championshipId: string,
    dayOrder: number,
    membershipNos: string[]
): Promise<EnrollChampionshipDayResult> {
    const uniqueMembershipNos = [...new Set(membershipNos.map((membershipNo) => membershipNo.trim()).filter(Boolean))]
    if (uniqueMembershipNos.length === 0) {
        return { enrolledCount: 0, skippedCount: 0 }
    }

    const championship = await getWritableChampionshipShell(championshipId)
    const registrationByMembership = new Map(
        championship.registrations.map((registration) => [registration.membershipNo, registration])
    )

    const missingMembershipNos = uniqueMembershipNos.filter((membershipNo) => !registrationByMembership.has(membershipNo))
    if (missingMembershipNos.length > 0) {
        throw new Error(`Not registered in championship: ${missingMembershipNos.join(", ")}`)
    }

    const assignments = mapDivisionRangeAssignments(championship.divisionRanges)
    const eligibleMembershipNos = filterMembershipNosEligibleOnDay(
        assignments,
        championship.rangeCount,
        dayOrder,
        uniqueMembershipNos,
        registrationByMembership
    )

    if (eligibleMembershipNos.length === 0) {
        throw new Error("No competitors have a range assignment for this day")
    }

    const byRange = new Map<number, string[]>()
    for (const membershipNo of eligibleMembershipNos) {
        const registration = registrationByMembership.get(membershipNo)!
        const rangeNumber = resolveEnrollmentRangeForRegistration(championship, dayOrder, registration)
        const rangeMembershipNos = byRange.get(rangeNumber) ?? []
        rangeMembershipNos.push(membershipNo)
        byRange.set(rangeNumber, rangeMembershipNos)
    }

    let enrolledCount = 0
    for (const [rangeNumber, rangeMembershipNos] of byRange) {
        const result = await enrollChampionshipCompetitorsOnDayRange(
            championshipId,
            dayOrder,
            rangeNumber,
            rangeMembershipNos
        )
        enrolledCount += result.enrolledCount
    }

    return {
        enrolledCount,
        skippedCount: uniqueMembershipNos.length - eligibleMembershipNos.length,
    }
}

export async function enrollAllChampionshipCompetitorsOnAssignedDays(
    championshipId: string,
    membershipNos: string[]
): Promise<EnrollChampionshipDayResult> {
    const championship = await getWritableChampionshipShell(championshipId)
    const dayOrders = [...new Set(championship.rounds.map((round) => round.dayOrder))].sort((a, b) => a - b)
    const assignments = mapDivisionRangeAssignments(championship.divisionRanges)

    if (
        !areChampionshipRangeAssignmentsComplete(
            championship.registrations,
            dayOrders,
            assignments,
            championship.rangeCount
        )
    ) {
        throw new Error("Assign every division to a range on each day before enrolling all competitors")
    }

    let enrolledCount = 0
    let skippedCount = 0
    for (const dayOrder of dayOrders) {
        const result = await enrollChampionshipCompetitorsOnDay(championshipId, dayOrder, membershipNos)
        enrolledCount += result.enrolledCount
        skippedCount += result.skippedCount
    }

    return { enrolledCount, skippedCount }
}

export async function enrollChampionshipCompetitorsOnDayRange(
    championshipId: string,
    dayOrder: number,
    rangeNumber: number,
    membershipNos: string[]
) {
    const uniqueMembershipNos = [...new Set(membershipNos.map((membershipNo) => membershipNo.trim()).filter(Boolean))]
    if (uniqueMembershipNos.length === 0) {
        return { enrolledCount: 0 }
    }

    const championship = await getWritableChampionshipShell(championshipId)
    const round = getChampionshipRoundByDayAndRange(championship, dayOrder, rangeNumber)
    const registrationByMembership = new Map(
        championship.registrations.map((registration) => [registration.membershipNo, registration])
    )

    const missingMembershipNos = uniqueMembershipNos.filter((membershipNo) => !registrationByMembership.has(membershipNo))
    if (missingMembershipNos.length > 0) {
        throw new Error(`Not registered in championship: ${missingMembershipNos.join(", ")}`)
    }

    const assignments = mapDivisionRangeAssignments(championship.divisionRanges)
    const priorRangesByMembership = await listPriorRangeNumbersByMembership(
        championship.id,
        dayOrder,
        uniqueMembershipNos
    )

    for (const membershipNo of uniqueMembershipNos) {
        const registration = registrationByMembership.get(membershipNo)!
        const assignedRange = resolveDivisionRangeForDay(
            assignments,
            championship.rangeCount,
            dayOrder,
            registration.ageGroupId,
            registration.categoryId,
            registration.genderGroup
        )
        if (assignedRange === null) {
            throw new Error("This division is not assigned to a range for this day")
        }
        assertRegistrationCanEnrollOnRange(
            championship,
            dayOrder,
            assignedRange,
            registration,
            assignments,
            priorRangesByMembership
        )
    }

    await prismaOrThrow("enroll championship competitors on day range").$transaction(async (tx) => {
        for (const membershipNo of uniqueMembershipNos) {
            const registration = registrationByMembership.get(membershipNo)!
            await tx.participant.upsert({
                where: {
                    tournamentId_membershipNo: {
                        tournamentId: round.tournamentId,
                        membershipNo,
                    },
                },
                create: participantDataFromRegistration(registration, round.tournamentId),
                update: participantUpdateFromRegistration(registration),
            })
        }
    })

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/tournaments/${round.tournamentId}`)
    return { enrolledCount: uniqueMembershipNos.length }
}

export async function unenrollChampionshipCompetitorFromDay(
    championshipId: string,
    dayOrder: number,
    membershipNo: string
) {
    const trimmedMembershipNo = membershipNo.trim()
    if (!trimmedMembershipNo) {
        throw new Error("Membership number is required")
    }

    const championship = await getWritableChampionshipShell(championshipId)
    const tournamentIds = championship.rounds
        .filter((round) => round.dayOrder === dayOrder)
        .map((round) => round.tournamentId)

    const participant = await prismaOrThrow("find day participant for unenroll").participant.findFirst({
        where: {
            tournamentId: { in: tournamentIds },
            membershipNo: trimmedMembershipNo,
        },
        select: { id: true, tournamentId: true },
    })

    if (!participant) {
        throw new Error("Competitor is not enrolled on this day")
    }

    await prismaOrThrow("unenroll championship competitor from day").participant.delete({
        where: { id: participant.id },
    })

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/tournaments/${participant.tournamentId}`)
}

export async function unenrollChampionshipCompetitorFromDayRange(
    championshipId: string,
    dayOrder: number,
    rangeNumber: number,
    membershipNo: string
) {
    const trimmedMembershipNo = membershipNo.trim()
    if (!trimmedMembershipNo) {
        throw new Error("Membership number is required")
    }

    const championship = await getWritableChampionshipShell(championshipId)
    const round = getChampionshipRoundByDayAndRange(championship, dayOrder, rangeNumber)

    const participant = await prismaOrThrow("find day participant for unenroll").participant.findFirst({
        where: {
            tournamentId: round.tournamentId,
            membershipNo: trimmedMembershipNo,
        },
        select: { id: true },
    })

    if (!participant) {
        throw new Error("Competitor is not enrolled on this day range")
    }

    await prismaOrThrow("unenroll championship competitor from day range").participant.delete({
        where: { id: participant.id },
    })

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/tournaments/${round.tournamentId}`)
}

export async function updateChampionshipRegistration(
    championshipId: string,
    registrationId: string,
    input: Omit<RegisterChampionshipParticipantInput, "championshipId">
) {
    await assertChampionshipWritable(championshipId)

    const registration = await prismaOrThrow("find championship registration for update")
        .championshipRegistration.findFirst({
            where: { id: registrationId, championshipId },
        })

    if (!registration) {
        throw new Error("Registration not found")
    }

    const championship = await getWritableChampionshipShell(championshipId)
    const oldMembershipNo = registration.membershipNo
    const trimmedProfile = {
        name: input.name.trim(),
        membershipNo: input.membershipNo.trim(),
        ageGroupId: input.ageGroupId,
        categoryId: input.categoryId,
        club: input.club.trim(),
        genderGroup: input.genderGroup,
    }

    try {
        await prismaOrThrow("update championship registration").$transaction(async (tx) => {
            await tx.championshipRegistration.update({
                where: { id: registrationId },
                data: trimmedProfile,
            })

            await tx.participant.updateMany({
                where: {
                    membershipNo: oldMembershipNo,
                    tournament: {
                        championshipRound: { championshipId },
                    },
                },
                data: {
                    ...participantUpdateFromRegistration({
                        ...trimmedProfile,
                        competitorNumber: registration.competitorNumber,
                    }),
                    membershipNo: trimmedProfile.membershipNo,
                },
            })
        })
    } catch (error) {
        if (isUniqueError(error) && getUniqueConstraintFields(error).includes("membershipNo")) {
            throw new Error("This membership number is already registered in this championship")
        }
        throw error
    }

    revalidatePath(`/championships/${championshipId}`)
    for (const round of championship.rounds) {
        revalidatePath(`/tournaments/${round.tournamentId}`)
    }
}

export async function removeChampionshipRegistration(championshipId: string, registrationId: string) {
    await assertChampionshipWritable(championshipId)

    const registration = await prismaOrThrow("find championship registration").championshipRegistration.findFirst({
        where: { id: registrationId, championshipId },
    })

    if (!registration) {
        throw new Error("Registration not found")
    }

    const enrolled = await prismaOrThrow("check championship enrollment").participant.findFirst({
        where: {
            membershipNo: registration.membershipNo,
            tournament: {
                championshipRound: { championshipId },
            },
        },
        select: { id: true },
    })

    if (enrolled) {
        throw new Error("Cannot remove a competitor enrolled on a championship day")
    }

    await prismaOrThrow("remove championship registration").championshipRegistration.delete({
        where: { id: registrationId },
    })

    revalidatePath(`/championships/${championshipId}`)
}

async function setChampionshipArchiveState(championshipId: string, isArchive: boolean) {
    await assertChampionshipAccessForId(championshipId)

    const championship = await prismaOrThrow("set championship archive state").championship.update({
        where: { id: championshipId },
        data: { isArchive },
        include: championshipShellInclude,
    })

    revalidatePath("/championships")
    revalidatePath(`/championships/${championshipId}`)
    return championship
}

export async function archiveChampionship(championshipId: string) {
    return setChampionshipArchiveState(championshipId, true)
}

export async function unarchiveChampionship(championshipId: string) {
    return setChampionshipArchiveState(championshipId, false)
}

export type ChampionshipSharingStatus = {
    tournamentCount: number
    sharingOption: SharingOption
}

async function listChampionshipTournamentIds(championshipId: string, clubs: string[]): Promise<string[]> {
    const championship = await getChampionshipForOrganizer(championshipId, clubs)
    if (!championship) {
        throw new Error("Unauthorized")
    }

    return championship.rounds.map((round) => round.tournamentId)
}

export async function getChampionshipSharingStatus(
    championshipId: string
): Promise<ChampionshipSharingStatus | null> {
    const clubs = await resolveChampionshipOrganizerClubs()
    if (!clubs) {
        return null
    }
    const championship = await getChampionshipForOrganizer(championshipId, clubs)
    if (!championship) {
        return null
    }

    const tournaments = championship.rounds.map((round) => ({
        id: round.tournamentId,
        isPublished: round.tournament.isPublished,
        isShared: round.tournament.isShared,
    }))

    if (tournaments.length === 0) {
        return {
            tournamentCount: 0,
            sharingOption: "private",
        }
    }

    return {
        tournamentCount: tournaments.length,
        sharingOption: aggregateSharingOption(tournaments),
    }
}

export async function updateChampionshipSharingSettings(
    championshipId: string,
    isPublished: boolean,
    isShared: boolean
): Promise<void> {
    const clubs = await assertChampionshipOrganizerClubs()
    await assertChampionshipWritable(championshipId)

    const tournamentIds = await listChampionshipTournamentIds(championshipId, clubs)
    if (tournamentIds.length === 0) {
        throw new Error("Add at least one championship day before sharing results")
    }

    await prismaOrThrow("update championship sharing settings").tournament.updateMany({
        where: { id: { in: tournamentIds } },
        data: { isPublished, isShared },
    })

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/results/championships/${championshipId}`)
    revalidatePath("/results/championships")
    revalidatePath("/results")
    for (const tournamentId of tournamentIds) {
        revalidatePath(`/tournaments/${tournamentId}/scores`)
    }
}

export type AutoSeedChampionshipDayResult = {
    dayOrder: number
    tournaments: {
        tournamentId: string
        rangeNumber: number
        assignmentsCount: number
    }[]
    warnings: string[]
}

export type { AutoSeedTargetRange }

export async function autoSeedChampionshipDay(
    championshipId: string,
    dayOrder: number,
    rangeNumber: number,
    targetRange: AutoSeedTargetRange
): Promise<AutoSeedChampionshipDayResult> {
    if (dayOrder < 2) {
        throw new Error("Auto-seed is only available from day 2 onward")
    }

    const clubs = await assertChampionshipOrganizerClubs()
    const championship = await getChampionshipForOrganizer(championshipId, clubs)
    if (!championship || championship.isArchive) {
        throw new Error("Unauthorized")
    }

    const dayRounds = championship.rounds.filter((round) => round.dayOrder === dayOrder)
    if (dayRounds.length === 0) {
        throw new Error(`Day ${dayOrder} not found`)
    }

    const round = dayRounds.find((item) => item.rangeNumber === rangeNumber)
    if (!round) {
        throw new Error(`Range ${rangeNumber} not found on day ${dayOrder}`)
    }

    const priorRounds = championship.rounds.filter((item) => item.dayOrder < dayOrder)
    if (priorRounds.length === 0) {
        throw new Error("Add and score the first day before auto-seeding later days")
    }

    const priorTournamentIds = new Set(priorRounds.map((round) => round.tournamentId))
    const [enrollmentByTournament, scores] = await Promise.all([
        listChampionshipDayEnrollmentByTournamentForChampionship(championship),
        listChampionshipDayScoresForChampionship(championship),
    ])

    if (!enrollmentByTournament || !scores) {
        throw new Error("Unable to load championship enrollment or scores")
    }

    const priorScores = scores.filter((score) => priorTournamentIds.has(score.tournamentId))
    const standings = buildChampionshipCombinedStandingsFromChampionshipData({
        registrations: championship.registrations,
        rounds: priorRounds.map((round) => ({
            dayOrder: round.dayOrder,
            rangeNumber: round.rangeNumber,
            tournamentId: round.tournamentId,
        })),
        scores: priorScores,
        enrollmentByTournament,
    })

    if (!standings) {
        throw new Error("Combined standings are not available for prior days")
    }

    const priorDayOrders = standings.days.map((day) => day.dayOrder)
    const competitorStandingsByCategory = buildCompetitorStandingsByCategoryFromChampionshipData({
        registrations: championship.registrations,
        rounds: priorRounds.map((priorRound) => ({
            dayOrder: priorRound.dayOrder,
            rangeNumber: priorRound.rangeNumber,
            tournamentId: priorRound.tournamentId,
        })),
        scores: priorScores,
        enrollmentByTournament,
    })

    const rangeError = validateAutoSeedTargetRange(targetRange, round.tournament.endCount)
    if (rangeError) {
        throw new Error(rangeError)
    }

    const divisionAssignments = mapDivisionRangeAssignments(championship.divisionRanges)
    const tournaments: AutoSeedChampionshipDayResult["tournaments"] = []

    await prismaOrThrow("auto-seed championship day").$transaction(async (tx) => {
        const participants = await tx.participant.findMany({
            where: { tournamentId: round.tournamentId },
            select: {
                id: true,
                membershipNo: true,
                competitorNumber: true,
                ageGroupId: true,
                categoryId: true,
                genderGroup: true,
            },
        })

        const eligibleParticipants =
            championship.rangeCount > 1
                ? participants.filter((participant) =>
                      participantAllowedOnRangeForDay(
                          participant,
                          dayOrder,
                          round.rangeNumber,
                          divisionAssignments
                      )
                  )
                : participants

        const plan = buildTournamentAutoSeedPlan({
            tournamentId: round.tournamentId,
            rangeNumber: round.rangeNumber,
            groupSize: round.tournament.groupSize,
            endCount: round.tournament.endCount,
            targetRange,
            participants: eligibleParticipants.map((participant) => ({
                ...participant,
                competitorNumber: participant.competitorNumber ?? 0,
            })),
            priorDayOrders,
            competitorStandingsByCategory,
        })

        assertAutoSeedPlanIsComplete(
            plan,
            eligibleParticipants.map((participant) => participant.id)
        )

        await tx.groupAssignment.deleteMany({
            where: { tournamentId: round.tournamentId },
        })

        if (plan.assignments.length > 0) {
            await createGroupAssignments(
                tx,
                mapSeedAssignmentsToCreateRows(round.tournamentId, plan.assignments)
            )
        }

        tournaments.push({
            tournamentId: round.tournamentId,
            rangeNumber: round.rangeNumber,
            assignmentsCount: plan.assignments.length,
        })
    })

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/tournaments/${round.tournamentId}/groups`)
    revalidatePath(`/tournaments/${round.tournamentId}/scores`)

    return { dayOrder, tournaments, warnings: [] }
}
