"use server"

import { GroupAssignment, Participant } from "@/generated/prisma/client"
import { prismaOrThrow } from "@/lib/prisma"
import {
    isTournamentResultsComplete,
    validateCheckedInParticipantsHaveScores,
} from "@/lib/tournamentSharingValidation"
import { ParticipantResult, SCORE_DNC, SCORE_DNF, toResult, toScore } from "@/lib/scoreUtils"
import { revalidatePath } from "next/cache"

export type ParticipantWithResult = Participant & { 
    result: ParticipantResult | null
    groupAssignment: GroupAssignment | null 
}
export type TournamentResults = ParticipantWithResult[]


export async function getTournamentResults(tournamentId: string): Promise<TournamentResults> {
    const participants = await prismaOrThrow("get tournament results").participant.findMany({
        where: {
            tournamentId: tournamentId,
            checkedIn: true,
        },
        include: {
            participantScore: true,
            groupAssignment: true,
        }
    })

    return participants.map(p => {
        const { participantScore, ...rest } = p
        return {
            ...rest,
            result: participantScore 
                ? toResult(Number(participantScore.score))
                : null
        }
    })
}

export async function getTournamentWithResultsStatus(tournamentId: string): Promise<{ tournament: { id: string, isPublished: boolean, isShared: boolean }, allResultsComplete: boolean }> {
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

    const allResultsComplete =
        tournament.participants.length > 0 && tournament.participants.every((p) => !!p.participantScore)

    return {
        tournament: {
            id: tournament.id,
            isPublished: tournament.isPublished,
            isShared: tournament.isShared
        },
        allResultsComplete
    }
}

export async function setScore(
    participantId: string,
    tournamentId: string,
    score: number,
    shootoff?: number
): Promise<void> {
    await upsertScore(participantId, tournamentId, toScore(score, shootoff))
}

export async function setDNF(participantId: string, tournamentId: string): Promise<void> {
    await upsertScore(participantId, tournamentId, SCORE_DNF)
}

export async function setDNC(participantId: string, tournamentId: string): Promise<void> {
    await upsertScore(participantId, tournamentId, SCORE_DNC)
}

export async function clearScore(participantId: string, tournamentId: string): Promise<void> {
    await prismaOrThrow("clear score").participantScore.deleteMany({
        where: { participantId, tournamentId }
    })
    revalidatePath(`/tournaments/${tournamentId}/scores`)
}

async function upsertScore(participantId: string, tournamentId: string, score: number): Promise<void> {
    await prismaOrThrow("upsert score").participantScore.upsert({
        where: { participantId_tournamentId: { participantId, tournamentId } },
        update: { score },
        create: { participantId, tournamentId, score }
    })
    revalidatePath(`/tournaments/${tournamentId}/scores`)
}

export async function updateShootoffScore(
    participantId: string,
    tournamentId: string,
    shootoff: number
): Promise<void> {
    const existing = await prismaOrThrow("get score for shootoff").participantScore.findUnique({
        where: { participantId_tournamentId: { participantId, tournamentId } }
    })

    if (!existing) {
        throw new Error("Cannot add shootoff to non-existent score")
    }

    const currentScore = Math.floor(Number(existing.score))
    const newScore = toScore(currentScore, shootoff)

    await prismaOrThrow("update shootoff").participantScore.update({
        where: { participantId_tournamentId: { participantId, tournamentId } },
        data: { score: newScore }
    })

    revalidatePath(`/tournaments/${tournamentId}/scores`)
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
