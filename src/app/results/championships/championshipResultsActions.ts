"use server"

import { prismaOrThrow } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { buildChampionshipCombinedStandingsFromChampionshipData } from "@/lib/championshipStandingsInput"
import type { ChampionshipCombinedStandings } from "@/lib/championshipCombinedStandings"
import {
    groupsFromParticipants,
    type PublicTournamentGroup,
    type PublicTournamentGroupsData,
} from "@/lib/publicTournamentGroups"

export type { PublicTournamentGroup, PublicTournamentGroupsData }

export type PublicChampionshipTournamentRef = {
    dayOrder: number
    rangeNumber: number
    tournamentId: string
    tournamentName: string
    date: Date
    organizerClub: string
    endCount: number
    groupSize: number
    isPublished: boolean
    isShared: boolean
}

export type PublicChampionshipResultsData = {
    championship: { id: string; name: string; organizerClub: string }
    rounds: PublicChampionshipTournamentRef[]
    standings: ChampionshipCombinedStandings | null
    groupsByTournamentId: Record<string, PublicTournamentGroupsData>
}

export type PublicChampionshipListItem = {
    id: string
    name: string
    organizerClub: string
    dayCount: number
    firstDate: Date | null
    lastDate: Date | null
}

function isTournamentPublic(t: { isPublished: boolean; isShared: boolean }): boolean {
    return t.isPublished || t.isShared
}

function toPublicChampionshipListItem(championship: {
    id: string
    name: string
    organizerClub: string
    rounds: { dayOrder: number; tournament: { date: Date; isPublished: boolean } }[]
}): PublicChampionshipListItem {
    const publishedRounds = championship.rounds.filter((round) => round.tournament.isPublished)
    const dayOrders = new Set(publishedRounds.map((round) => round.dayOrder))
    const dates = publishedRounds.map((round) => round.tournament.date.getTime())

    return {
        id: championship.id,
        name: championship.name,
        organizerClub: championship.organizerClub,
        dayCount: dayOrders.size,
        firstDate: dates.length > 0 ? new Date(Math.min(...dates)) : null,
        lastDate: dates.length > 0 ? new Date(Math.max(...dates)) : null,
    }
}

export async function listPublicChampionships(): Promise<PublicChampionshipListItem[]> {
    const championships = await prismaOrThrow("list public championships").championship.findMany({
        where: {
            rounds: {
                some: {
                    tournament: { isPublished: true },
                },
            },
        },
        include: {
            rounds: {
                include: {
                    tournament: {
                        select: { date: true, isPublished: true },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    })

    return championships
        .map(toPublicChampionshipListItem)
        .sort((a, b) => (b.lastDate?.getTime() ?? 0) - (a.lastDate?.getTime() ?? 0))
}

export async function getPublicChampionshipResults(championshipId: string): Promise<PublicChampionshipResultsData> {
    const championship = await prismaOrThrow("get public championship").championship.findUnique({
        where: { id: championshipId },
        include: {
            registrations: {
                include: {
                    ageGroup: true,
                    category: true,
                },
            },
            rounds: {
                include: {
                    tournament: true,
                },
            },
        },
    })

    if (!championship) {
        notFound()
    }

    const publicRounds = championship.rounds
        .filter((round) => isTournamentPublic(round.tournament))
        .map((round) => ({
            dayOrder: round.dayOrder,
            rangeNumber: round.rangeNumber,
            tournamentId: round.tournamentId,
            tournamentName: round.tournament.name,
            date: round.tournament.date,
            organizerClub: round.tournament.organizerClub,
            endCount: round.tournament.endCount,
            groupSize: round.tournament.groupSize,
            isPublished: round.tournament.isPublished,
            isShared: round.tournament.isShared,
        }))
        .sort((a, b) => (a.dayOrder - b.dayOrder) || (a.rangeNumber - b.rangeNumber))

    if (publicRounds.length === 0) {
        notFound()
    }

    const tournamentIds = publicRounds.map((round) => round.tournamentId)

    const [enrollmentRows, scoreRows, groupParticipants] = await Promise.all([
        prismaOrThrow("get public championship enrollment").participant.findMany({
            where: { tournamentId: { in: tournamentIds } },
            select: { tournamentId: true, membershipNo: true },
        }),
        prismaOrThrow("get public championship scores").participant.findMany({
            where: { tournamentId: { in: tournamentIds } },
            select: {
                tournamentId: true,
                membershipNo: true,
                participantScore: { select: { score: true } },
            },
        }),
        prismaOrThrow("get public championship groups").participant.findMany({
            where: { tournamentId: { in: tournamentIds } },
            select: {
                id: true,
                tournamentId: true,
                membershipNo: true,
                competitorNumber: true,
                name: true,
                club: true,
                groupAssignment: { select: { groupNumber: true, isCaptain: true, positionInGroup: true } },
            },
        }),
    ])

    const enrollmentByTournament: Record<string, string[]> = {}
    for (const row of enrollmentRows) {
        enrollmentByTournament[row.tournamentId] ??= []
        enrollmentByTournament[row.tournamentId].push(row.membershipNo)
    }

    const scores = scoreRows.map((row) => ({
        tournamentId: row.tournamentId,
        membershipNo: row.membershipNo,
        rawScore: row.participantScore ? Number(row.participantScore.score) : null,
    }))

    const standings = buildChampionshipCombinedStandingsFromChampionshipData({
        registrations: championship.registrations,
        rounds: publicRounds.map((round) => ({
            dayOrder: round.dayOrder,
            rangeNumber: round.rangeNumber,
            tournamentId: round.tournamentId,
        })),
        scores,
        enrollmentByTournament,
    })

    const participantsByTournament = new Map<string, typeof groupParticipants>()
    for (const participant of groupParticipants) {
        const existing = participantsByTournament.get(participant.tournamentId) ?? []
        existing.push(participant)
        participantsByTournament.set(participant.tournamentId, existing)
    }

    const groupsByTournamentId: Record<string, PublicTournamentGroupsData> = {}
    for (const round of publicRounds) {
        const participants = participantsByTournament.get(round.tournamentId) ?? []
        const { groups, unassigned } = groupsFromParticipants(round.endCount, participants)
        groupsByTournamentId[round.tournamentId] = {
            tournament: {
                tournamentId: round.tournamentId,
                tournamentName: round.tournamentName,
                endCount: round.endCount,
                groupSize: round.groupSize,
            },
            groups,
            unassigned,
        }
    }

    return {
        championship: { id: championship.id, name: championship.name, organizerClub: championship.organizerClub },
        rounds: publicRounds,
        standings,
        groupsByTournamentId,
    }
}

export type PublicChampionshipDayGroupsPrintData = {
    championship: { id: string; name: string; organizerClub: string }
    dayOrder: number
    rounds: {
        dayOrder: number
        rangeNumber: number
        tournamentId: string
        tournamentName: string
        date: Date
        endCount: number
        groupSize: number
    }[]
    groupsByTournamentId: Record<string, PublicTournamentGroupsData>
}

export async function getPublicChampionshipDayGroupsData(
    championshipId: string,
    dayOrder: number
): Promise<PublicChampionshipDayGroupsPrintData> {
    const data = await getPublicChampionshipResults(championshipId)

    const dayRounds = data.rounds.filter((round) => round.dayOrder === dayOrder)
    if (dayRounds.length === 0) {
        notFound()
    }

    const groupsByTournamentId: Record<string, PublicTournamentGroupsData> = {}
    for (const round of dayRounds) {
        const groupsData = data.groupsByTournamentId[round.tournamentId]
        if (groupsData) {
            groupsByTournamentId[round.tournamentId] = groupsData
        }
    }

    return {
        championship: data.championship,
        dayOrder,
        rounds: dayRounds.map((round) => ({
            dayOrder: round.dayOrder,
            rangeNumber: round.rangeNumber,
            tournamentId: round.tournamentId,
            tournamentName: round.tournamentName,
            date: round.date,
            endCount: round.endCount,
            groupSize: round.groupSize,
        })),
        groupsByTournamentId,
    }
}

