"use server"

import { AgeGroup, EquipmentCategory, Participant, ParticipantScore, RoundFormat, Tournament } from "@prisma/client"
import { notFound } from "next/navigation"
import { prismaOrThrow } from "../../../lib/prisma"

export type ParticipantResultsData = Participant & { participantScore: ParticipantScore, ageGroup: AgeGroup, category: EquipmentCategory }
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
                },
                include: {
                    participantScore: true,
                    ageGroup: true,
                    category: true
                }
            }
        }
    })

    if (!tournament) {
        notFound()
    }

    // Filter out participants without scores (shouldn't happen for published tournaments, but type-safe)
    const participantsWithScores = tournament.participants.filter(
        (p): p is ParticipantResultsData => p.participantScore !== null
    )

    return {
        tournament: {
            ...tournament,
            format: tournament.format
        },
        participants: participantsWithScores
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