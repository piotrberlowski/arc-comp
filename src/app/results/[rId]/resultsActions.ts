"use server"

import { notFound } from "next/navigation"
import { prismaOrThrow } from "../../../../lib/prisma"

export interface TournamentResultsData {
    tournament: {
        id: string
        name: string
        date: Date
        formatId: string
        organizerClub: string
        isArchive: boolean
        isPublished: boolean
        format: {
            name: string
            endCount: number
            groupSize: number
        }
    }
    participants: ParticipantResultData[]
}

export interface ParticipantResultData {
    id: string
    participantId: string
    tournamentId: string
    score: number | null
    isComplete: boolean
    participant: {
        id: string
        name: string
        membershipNo: string
        ageGroupId: string
        categoryId: string
        club: string | null
        groupAssignment?: {
            groupNumber: number
        } | null
        ageGroup: {
            id: string
            name: string
        }
        genderGroup: string
        equipmentCategory: {
            id: string
            name: string
        }
    }
}

export async function getTournamentResults(tournamentId: string): Promise<TournamentResultsData> {
    const tournament = await prismaOrThrow("get tournament results").tournament.findUnique({
        where: {
            id: tournamentId
        },
        include: {
            format: true,
            participants: {
                where: {
                    checkedIn: true
                },
                include: {
                    groupAssignment: true,
                    participantScore: true,
                    ageGroup: true,
                    category: true
                }
            }
        }
    })

    if (!tournament || !tournament.isPublished) {
        notFound()
    }

    return transformTournamentResults(tournament)
}

function transformTournamentResults(tournament: {
    id: string
    name: string
    date: Date
    formatId: string
    organizerClub: string
    isArchive: boolean
    isPublished: boolean
    format: {
        name: string
        endCount: number
        groupSize: number
    }
    participants: Array<{
        id: string
        name: string
        membershipNo: string
        ageGroupId: string
        categoryId: string
        club: string | null
        genderGroup: string
        groupAssignment?: {
            groupNumber: number
        } | null
        participantScore?: {
            id: string
            score: number | null
            isComplete: boolean
        } | null
        ageGroup: {
            id: string
            name: string
        }
        category: {
            id: string
            name: string
        }
    }>
}): TournamentResultsData {
    const participants: ParticipantResultData[] = tournament.participants.map((p) => ({
        id: p.participantScore?.id || '',
        participantId: p.id,
        tournamentId: tournament.id,
        score: p.participantScore?.score || null,
        isComplete: p.participantScore?.isComplete || false,
        participant: {
            id: p.id,
            name: p.name,
            membershipNo: p.membershipNo,
            ageGroupId: p.ageGroupId,
            categoryId: p.categoryId,
            club: p.club,
            groupAssignment: p.groupAssignment ? {
                groupNumber: p.groupAssignment.groupNumber
            } : null,
            ageGroup: p.ageGroup,
            genderGroup: p.genderGroup,
            equipmentCategory: p.category
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
            isPublished: tournament.isPublished,
            format: {
                name: tournament.format.name,
                endCount: tournament.format.endCount,
                groupSize: tournament.format.groupSize
            }
        },
        participants
    }
}
