"use server"

import { AgeGroup, EquipmentCategory, Participant, RoundFormat, Tournament } from "@/generated/prisma/client"
import { prismaOrThrow } from "@/lib/prisma"
import { ParticipantResult, toResult } from "@/lib/scoreUtils"
import { notFound } from "next/navigation"

export type ParticipantResultsData = Participant & { result: ParticipantResult, ageGroup: AgeGroup, category: EquipmentCategory }
// Alias for backward compatibility
export type ParticipantResultData = ParticipantResultsData
export type TournamentResultsData = { tournament: Tournament & { format: RoundFormat }, participants: ParticipantResultsData[] }

export async function getTournamentResults(tournamentId: string): Promise<TournamentResultsData> {
    const tournament = await prismaOrThrow("get tournament results").tournament.findUnique({
        where: {
            id: tournamentId,
            OR: [{
                isPublished: true,
            }, {
                isShared: true,
            }],
        },
        include: {
            format: true,
            participants: {
                where: {
                    checkedIn: true,
                    participantScore: { isNot: null }
                },
                include: {
                    participantScore: true,
                    ageGroup: true,
                    category: true
                },
                orderBy: [
                    { participantScore: { score: 'desc' } },
                    { name: 'asc' }
                ]
            }
        }
    })

    if (!tournament) {
        notFound()
    }

    const participantsWithResults: ParticipantResultsData[] = tournament.participants.map(p => {
        const { participantScore, ...rest } = p
        return {
            ...rest,
            result: toResult(Number(participantScore!.score))
        }
    })

    const { participants: _, ...tournamentWithoutParticipants } = tournament
    return {
        tournament: { ...tournamentWithoutParticipants, format: tournament.format },
        participants: participantsWithResults
    }
}


export async function listPublishedTournaments(): Promise<(Tournament & { format: RoundFormat })[]> {
    return prismaOrThrow("get published tournaments").tournament.findMany({
        where: {
            isPublished: true
        },
        include: {
            format: true
        },
        orderBy: {
            date: 'desc'
        }
    })
}