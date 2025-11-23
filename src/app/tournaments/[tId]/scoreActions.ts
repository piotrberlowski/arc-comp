"use server"

import { GroupAssignment, Participant, ParticipantScore } from "@/generated/prisma/client"
import { prismaOrThrow } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ParticipantWithScore = Participant & { participantScore: ParticipantScore | null, groupAssignment: GroupAssignment | null }
export type TournamentScores = (ParticipantWithScore)[]

export async function getTournamentScores(tournamentId: string): Promise<TournamentScores> {
    return prismaOrThrow("get tournament scores").participant.findMany({
        where: {
            tournamentId: tournamentId,
            checkedIn: true,
        },
        include: {
            participantScore: true,
            groupAssignment: true,
        }
    })
}

export async function getTournamentWithScoresStatus(tournamentId: string): Promise<{ tournament: { id: string, isPublished: boolean, isShared: boolean }, allScoresComplete: boolean }> {
    const tournament = await prismaOrThrow("get tournament with scores status").tournament.findUnique({
        where: { id: tournamentId },
        include: {
            participants: {
                where: {
                    checkedIn: true,
                },
                include: {
                    participantScore: true
                }
            }
        }
    })

    if (!tournament) {
        throw new Error("Tournament not found")
    }

    const allScoresComplete = tournament.participants.length > 0 && tournament.participants.every(p => !!p.participantScore)

    return {
        tournament: {
            id: tournament.id,
            isPublished: tournament.isPublished,
            isShared: tournament.isShared
        },
        allScoresComplete
    }
}

export async function updateScore(
    participantId: string,
    tournamentId: string,
    score: number | null
): Promise<void> {
    if (score === null) {
        // Remove the score record to blank it
        await prismaOrThrow("blank score").participantScore.deleteMany({
            where: {
                participantId,
                tournamentId
            }
        })
    } else {
        // Upsert the score
        await prismaOrThrow("update score").participantScore.upsert({
            where: {
                participantId_tournamentId: {
                    participantId,
                    tournamentId
                }
            },
            update: {
                score
            },
            create: {
                participantId,
                tournamentId,
                score
            }
        })
    }

    revalidatePath(`/tournaments/${tournamentId}/scores`)
}

async function validateCheckedInParticipantsHaveScores(
    tournamentId: string,
    errorMessagePrefix: string
): Promise<void> {
    const tournament = await prismaOrThrow("validate checked-in participants have scores").tournament.findUnique({
        where: { id: tournamentId },
        include: {
            participants: {
                where: {
                    checkedIn: true
                },
                include: {
                    participantScore: true
                }
            }
        }
    })

    if (!tournament) {
        throw new Error("Tournament not found")
    }

    const incompleteParticipants = tournament.participants.filter(p =>
        !p.participantScore
    )

    if (incompleteParticipants.length > 0) {
        throw new Error(`${errorMessagePrefix}: ${incompleteParticipants.length} participants have incomplete scores`)
    }
}

export async function updateSharingSettings(
    tournamentId: string,
    isPublished: boolean,
    isShared: boolean
): Promise<void> {
    // Check if all checked-in participants have completed scores when making public
    if (isPublished) {
        await validateCheckedInParticipantsHaveScores(tournamentId, "Cannot make results public")
    }

    // Update tournament sharing settings
    await prismaOrThrow("update sharing settings").tournament.update({
        where: { id: tournamentId },
        data: {
            isPublished,
            isShared
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/scores`)
    revalidatePath(`/tournaments`)
    revalidatePath(`/results`)
}
