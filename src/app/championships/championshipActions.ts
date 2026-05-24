"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@/generated/prisma/client"
import { championshipDayTournamentName, nextChampionshipDayOrder } from "@/lib/championshipDayNaming"
import { assertChampionshipOrganizerClubs, resolveChampionshipOrganizerClubs } from "@/lib/championshipOrganizerSession"
import { participantDataFromRegistration, participantUpdateFromRegistration } from "@/lib/championshipEnrollment"
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

export interface AddChampionshipDayInput {
    championshipId: string
    name: string
    formatId: string
    date: Date
    endCount: number
    groupSize: number
}

async function syncDayTournamentNamesForChampionship(
    tx: Prisma.TransactionClient,
    championshipId: string,
    championshipName: string
) {
    const rounds = await tx.championshipRound.findMany({
        where: { championshipId },
        select: { dayOrder: true, tournamentId: true },
    })

    for (const round of rounds) {
        await tx.tournament.update({
            where: { id: round.tournamentId },
            data: { name: championshipDayTournamentName(championshipName, round.dayOrder) },
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
        orderBy: { dayOrder: "asc" as const },
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

    return prismaOrThrow("add championship day").$transaction(async (tx) => {
        const tournament = await tx.tournament.create({
            data: {
                name: input.name.trim(),
                organizerClub: championship.organizerClub,
                formatId: input.formatId,
                date: input.date,
                endCount: input.endCount,
                groupSize: input.groupSize,
            },
        })

        return tx.championshipRound.create({
            data: {
                championshipId: input.championshipId,
                dayOrder,
                tournamentId: tournament.id,
            },
            include: {
                tournament: true,
            },
        })
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

    const round = championship.rounds.find((item) => item.dayOrder === dayOrder)
    if (!round) {
        throw new Error("Championship day not found")
    }

    const scoreCount = round.tournament._count.participantScores
    if (scoreCount > 0) {
        throw new Error("Cannot remove a day after scores have been entered")
    }

    return prismaOrThrow("remove championship day").$transaction(async (tx) => {
        await tx.participant.deleteMany({
            where: { tournamentId: round.tournamentId },
        })
        await tx.championshipRound.delete({
            where: {
                championshipId_dayOrder: {
                    championshipId,
                    dayOrder,
                },
            },
        })
        await tx.tournament.delete({
            where: { id: round.tournamentId },
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

export async function listChampionshipDayEnrollmentByTournament(
    championshipId: string,
    organizerClubs: string[]
): Promise<Record<string, string[]> | null> {
    const championship = await getChampionshipForOrganizer(championshipId, organizerClubs)
    if (!championship) {
        return null
    }

    const participants = await prismaOrThrow("list championship day enrollments").participant.findMany({
        where: {
            tournament: {
                championshipRound: { championshipId },
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

function getChampionshipRoundByDayOrder(championship: ChampionshipShellRow, dayOrder: number) {
    const round = championship.rounds.find((item) => item.dayOrder === dayOrder)
    if (!round) {
        throw new Error("Championship day not found")
    }
    return round
}

export async function enrollChampionshipCompetitorsOnDay(
    championshipId: string,
    dayOrder: number,
    membershipNos: string[]
) {
    const uniqueMembershipNos = [...new Set(membershipNos.map((membershipNo) => membershipNo.trim()).filter(Boolean))]
    if (uniqueMembershipNos.length === 0) {
        return { enrolledCount: 0 }
    }

    const championship = await getWritableChampionshipShell(championshipId)
    const round = getChampionshipRoundByDayOrder(championship, dayOrder)
    const registrationByMembership = new Map(
        championship.registrations.map((registration) => [registration.membershipNo, registration])
    )

    const missingMembershipNos = uniqueMembershipNos.filter((membershipNo) => !registrationByMembership.has(membershipNo))
    if (missingMembershipNos.length > 0) {
        throw new Error(`Not registered in championship: ${missingMembershipNos.join(", ")}`)
    }

    await prismaOrThrow("enroll championship competitors on day").$transaction(async (tx) => {
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
    const round = getChampionshipRoundByDayOrder(championship, dayOrder)

    const participant = await prismaOrThrow("find day participant for unenroll").participant.findFirst({
        where: {
            tournamentId: round.tournamentId,
            membershipNo: trimmedMembershipNo,
        },
        select: { id: true },
    })

    if (!participant) {
        throw new Error("Competitor is not enrolled on this day")
    }

    await prismaOrThrow("unenroll championship competitor from day").participant.delete({
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
