"use server"

import { Prisma } from "@/generated/prisma/client"
import { assertChampionshipOrganizerClubs, resolveChampionshipOrganizerClubs } from "@/lib/championshipOrganizerSession"
import { prismaOrThrow } from "@/lib/prisma"

export interface ChampionshipCreateInput {
    name: string
    organizerClub: string
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

export interface RegisterChampionshipParticipantInput {
    championshipId: string
    membershipNo: string
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
        include: { tournament: true },
        orderBy: { dayOrder: "asc" as const },
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

    return prismaOrThrow("create championship").championship.create({
        data: {
            name: input.name,
            organizerClub: input.organizerClub,
        },
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

    return prismaOrThrow("update championship").championship.update({
        where: { id: championshipId },
        data: input,
    }).catch((error) => {
        console.error("Failed to update championship:", error)
        throw new Error("Unable to update championship")
    })
}

export async function listMyChampionships(): Promise<ChampionshipShellRow[] | null> {
    const clubs = await resolveChampionshipOrganizerClubs()
    if (!clubs) {
        return null
    }

    return listMyChampionshipsForClubs(clubs)
}

export async function listMyChampionshipsForClubs(clubs: string[]): Promise<ChampionshipShellRow[] | null> {
    return prismaOrThrow("list championships").championship.findMany({
        where: {
            organizerClub: {
                in: clubs,
            },
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
    await assertChampionshipAccessForId(championshipId)

    return prismaOrThrow("remove championship round").championshipRound.delete({
        where: {
            championshipId_dayOrder: {
                championshipId,
                dayOrder,
            },
        },
    }).catch((error) => {
        console.error("Failed to remove championship round:", error)
        throw new Error("Unable to remove championship round")
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
    await assertChampionshipAccessForId(input.championshipId)

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
                        membershipNo: input.membershipNo,
                        competitorNumber: nextCompetitorNumber,
                    },
                })
            }, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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
