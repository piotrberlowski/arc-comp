"use server"

import { revalidatePath } from "next/cache"
import { prismaOrThrow } from "../../../../lib/prisma"


export interface ParticipantScoreData {
    id: string
    participantId: string
    tournamentId: string
    score: number | null
    isComplete: boolean
    participant: {
        id: string
        name: string
        ageGroupId: string
        genderGroup: string
        categoryId: string
        club: string | null
        groupAssignment?: {
            groupNumber: number
        } | null
    }
}

export interface TournamentScoresData {
    tournament: {
        id: string
        name: string
        date: Date
        formatId: string
        organizerClub: string
        isArchive: boolean
        format: {
            name: string
            endCount: number
            groupSize: number
        }
    }
    participants: ParticipantScoreData[]
}

export async function getTournamentScores(tournamentId: string): Promise<TournamentScoresData> {
    const tournament = await prismaOrThrow("get tournament scores").tournament.findUnique({
        where: { id: tournamentId },
        include: {
            format: true,
            participants: {
                include: {
                    groupAssignment: true,
                    participantScore: true
                }
            }
        }
    })

    if (!tournament) {
        throw new Error("Tournament not found")
    }

    const participants: ParticipantScoreData[] = tournament.participants.map(p => ({
        id: p.participantScore?.id || '',
        participantId: p.id,
        tournamentId: tournament.id,
        score: p.participantScore?.score || null,
        isComplete: p.participantScore?.isComplete || false,
        participant: {
            id: p.id,
            name: p.name,
            ageGroupId: p.ageGroupId,
            genderGroup: p.genderGroup,
            categoryId: p.categoryId,
            club: p.club,
            groupAssignment: p.groupAssignment ? {
                groupNumber: p.groupAssignment.groupNumber
            } : null
        }
    }))

    return {
        tournament: {
            id: tournament.id,
            name: tournament.name,
            date: tournament.date,
            formatId: tournament.formatId,
            organizerClub: tournament.organizerClub,
            isArchive: tournament.isArchive,
            format: {
                name: tournament.format.name,
                endCount: tournament.format.endCount,
                groupSize: tournament.format.groupSize
            }
        },
        participants
    }
}

export async function updateScore(
    participantId: string,
    tournamentId: string,
    score: number | null,
    isComplete: boolean = false
): Promise<void> {
    await prismaOrThrow("update score").participantScore.upsert({
        where: {
            participantId_tournamentId: {
                participantId,
                tournamentId
            }
        },
        update: {
            score,
            isComplete
        },
        create: {
            participantId,
            tournamentId,
            score,
            isComplete
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/scores`)
}

export async function blankScore(
    participantId: string,
    tournamentId: string
): Promise<void> {
    await prismaOrThrow("blank score").participantScore.delete({
        where: {
            participantId_tournamentId: {
                participantId,
                tournamentId
            }
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/scores`)
}
