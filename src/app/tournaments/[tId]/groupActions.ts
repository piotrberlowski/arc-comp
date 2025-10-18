"use server"

import { GroupAssignment, Participant, RoundFormat, Tournament } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prismaOrThrow } from "../../../../lib/prisma"

export interface GroupData {
    groupNumber: number
    participants: (Participant & { groupAssignment: GroupAssignment | null })[]
}

export interface TournamentGroupsData {
    tournament: Tournament & { format: RoundFormat }
    groups: GroupData[]
    unassignedParticipants: (Participant & { groupAssignment: GroupAssignment | null })[]
}

export async function getTournamentGroups(tournamentId: string): Promise<TournamentGroupsData> {
    const tournament = await prismaOrThrow("get tournament").tournament.findUnique({
        where: { id: tournamentId },
        include: {
            format: true,
            participants: {
                include: {
                    groupAssignment: true
                }
            }
        }
    })

    if (!tournament) {
        throw new Error("Tournament not found")
    }

    const { format } = tournament
    const numGroups = format.endCount

    // Initialize groups
    const groups: GroupData[] = []
    for (let i = 1; i <= numGroups; i++) {
        groups.push({
            groupNumber: i,
            participants: []
        })
    }

    // Separate assigned and unassigned participants
    const assignedParticipants: { [key: number]: (Participant & { groupAssignment: GroupAssignment | null })[] } = {}
    const unassignedParticipants: (Participant & { groupAssignment: GroupAssignment | null })[] = []

    tournament.participants.forEach(participant => {
        if (participant.groupAssignment) {
            const groupNum = participant.groupAssignment.groupNumber
            if (!assignedParticipants[groupNum]) {
                assignedParticipants[groupNum] = []
            }
            assignedParticipants[groupNum].push(participant)
        } else {
            unassignedParticipants.push(participant)
        }
    })

    // Populate groups with assigned participants
    groups.forEach(group => {
        group.participants = assignedParticipants[group.groupNumber] || []
    })

    return {
        tournament,
        groups,
        unassignedParticipants
    }
}

export async function assignParticipantToGroup(
    participantId: string,
    tournamentId: string,
    groupNumber: number
): Promise<void> {
    // Get tournament format to check group size
    const tournament = await prismaOrThrow("get tournament for validation").tournament.findUnique({
        where: { id: tournamentId },
        include: { format: true }
    })

    if (!tournament) {
        throw new Error("Tournament not found")
    }

    // Check current group size
    const currentGroupCount = await prismaOrThrow("count group participants").groupAssignment.count({
        where: {
            tournamentId,
            groupNumber
        }
    })

    if (currentGroupCount >= tournament.format.groupSize) {
        throw new Error(`Group ${groupNumber} is already full (${currentGroupCount}/${tournament.format.groupSize})`)
    }

    await prismaOrThrow("assign participant to group").groupAssignment.upsert({
        where: {
            participantId_tournamentId: {
                participantId,
                tournamentId
            }
        },
        update: {
            groupNumber
        },
        create: {
            participantId,
            tournamentId,
            groupNumber
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/groups`)
}

export async function unassignParticipantFromGroup(
    participantId: string,
    tournamentId: string
): Promise<void> {
    await prismaOrThrow("unassign participant from group").groupAssignment.delete({
        where: {
            participantId_tournamentId: {
                participantId,
                tournamentId
            }
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/groups`)
}

export async function moveParticipantBetweenGroups(
    participantId: string,
    tournamentId: string,
    newGroupNumber: number
): Promise<void> {
    await assignParticipantToGroup(participantId, tournamentId, newGroupNumber)
}
