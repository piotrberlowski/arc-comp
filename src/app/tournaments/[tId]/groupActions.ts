"use server"

import { GroupAssignment, Participant, RoundFormat, Tournament } from "@/generated/prisma/client"
import { prismaOrThrow } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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

    const numGroups = tournament.endCount

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

    // Populate groups with assigned participants, sorted with target captain first
    groups.forEach(group => {
        const participants = assignedParticipants[group.groupNumber] || []
        // Sort: target captain first, then others
        group.participants = participants.sort((a, b) => {
            const aIsCaptain = a.groupAssignment?.isCaptain ?? false
            const bIsCaptain = b.groupAssignment?.isCaptain ?? false
            if (aIsCaptain && !bIsCaptain) return -1
            if (!aIsCaptain && bIsCaptain) return 1
            return 0
        })
    })

    return {
        tournament,
        groups,
        unassignedParticipants
    }
}

// Helper function to reassign captain in a group (first remaining person)
async function reassignCaptainInGroup(
    tx: Parameters<Parameters<ReturnType<typeof prismaOrThrow>['$transaction']>[0]>[0],
    tournamentId: string,
    groupNumber: number
): Promise<void> {
    const firstRemaining = await tx.groupAssignment.findFirst({
        where: {
            tournamentId,
            groupNumber
        },
        orderBy: {
            id: 'asc'
        }
    })

    if (firstRemaining) {
        await tx.groupAssignment.update({
            where: {
                participantId_tournamentId: {
                    participantId: firstRemaining.participantId,
                    tournamentId
                }
            },
            data: {
                isCaptain: true
            }
        })
    }
}

export async function assignParticipantToGroup(
    participantId: string,
    tournamentId: string,
    groupNumber: number
): Promise<void> {
    // Get tournament with format and participants in the target group in a single query
    const tournament = await prismaOrThrow("get tournament for validation").tournament.findUnique({
        where: { id: tournamentId },
        include: {
            groupAssignments: {
                where: { groupNumber }
            }
        }
    })

    if (!tournament) {
        throw new Error("Tournament not found")
    }

    // Check if group is full (using the preloaded groupAssignments) - do this before querying participant
    if (tournament.groupAssignments.length >= tournament.groupSize) {
        throw new Error(`Group ${groupNumber} is already full (${tournament.groupAssignments.length}/${tournament.groupSize})`)
    }

    // Check if participant exists and get their current assignment
    const participant = await prismaOrThrow("get participant with assignment").participant.findUnique({
        where: { id: participantId },
        include: { groupAssignment: true }
    })

    if (!participant) {
        throw new Error("Participant not found")
    }

    const oldGroupNumber = participant.groupAssignment?.groupNumber
    const wasCaptain = participant.groupAssignment?.isCaptain ?? false

    // If already in the target group, nothing to do
    if (oldGroupNumber === groupNumber) {
        return
    }

    // Check if this is the first person in the group (should be target captain)
    const isFirstInGroup = tournament.groupAssignments.length === 0

    await prismaOrThrow("assign participant to group in transaction").$transaction(async (tx) => {
        // Assign participant to group
        await tx.groupAssignment.upsert({
            where: {
                participantId_tournamentId: {
                    participantId,
                    tournamentId
                }
            },
            update: {
                groupNumber,
                // If moving to a new group and it's empty (first person), make them captain
                // Otherwise, clear captain status (they can be set as captain manually later)
                isCaptain: isFirstInGroup
            },
            create: {
                participantId,
                tournamentId,
                groupNumber,
                // Set as captain if this is the first person in the group
                isCaptain: isFirstInGroup
            }
        })

        // If they were captain in the old group, reassign captain (first remaining person)
        if (wasCaptain && oldGroupNumber) {
            await reassignCaptainInGroup(tx, tournamentId, oldGroupNumber)
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/groups`)
    revalidatePath(`/tournaments/${tournamentId}/scores`, "page")
}

export async function unassignParticipantFromGroup(
    participantId: string,
    tournamentId: string
): Promise<void> {
    // Get the assignment before deleting to check if they were captain
    const assignment = await prismaOrThrow("get assignment before delete").groupAssignment.findUnique({
        where: {
            participantId_tournamentId: {
                participantId,
                tournamentId
            }
        }
    })

    // If no assignment exists, nothing to do
    if (!assignment) {
        return
    }

    const wasCaptain = assignment.isCaptain
    const groupNumber = assignment.groupNumber

    await prismaOrThrow("unassign participant from group in transaction").$transaction(async (tx) => {
        // Delete the assignment
        await tx.groupAssignment.delete({
            where: {
                participantId_tournamentId: {
                    participantId,
                    tournamentId
                }
            }
        })

        // If they were the captain, reassign captain (first remaining person in the group)
        if (wasCaptain) {
            await reassignCaptainInGroup(tx, tournamentId, groupNumber)
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/groups`)
    revalidatePath(`/tournaments/${tournamentId}/scores`, "page")
}

export async function setTargetCaptain(
    participantId: string,
    tournamentId: string,
    groupNumber: number
): Promise<void> {
    await prismaOrThrow("set target captain in transaction").$transaction(async (tx) => {
        // Optimistically set this participant as captain (only if they're in the expected group)
        const updateResult = await tx.groupAssignment.updateMany({
            where: {
                participantId,
                tournamentId,
                groupNumber // Ensure they're in the expected group
            },
            data: {
                isCaptain: true
            }
        })

        // If the update modified records (participant exists and was updated), unset other captains
        if (updateResult.count > 0) {
            await tx.groupAssignment.updateMany({
                where: {
                    tournamentId,
                    groupNumber,
                    isCaptain: true,
                    participantId: { not: participantId } // Exclude the participant we just set
                },
                data: {
                    isCaptain: false
                }
            })
        } else {
            throw new Error("Participant is not assigned to the specified group")
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/groups`)
    revalidatePath(`/tournaments/${tournamentId}/scores`, "page")
}

export async function cleanupGroups(tournamentId: string): Promise<number> {
    // Get all group assignments for non-checked-in participants
    const assignmentsToRemove = await prismaOrThrow("get non-checked-in assignments").groupAssignment.findMany({
        where: {
            tournamentId,
            participant: {
                checkedIn: false
            }
        }
    })

    // Remove the assignments
    await prismaOrThrow("cleanup groups").groupAssignment.deleteMany({
        where: {
            tournamentId,
            participant: {
                checkedIn: false
            }
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/groups`)
    revalidatePath(`/tournaments/${tournamentId}/scores`, "page")

    return assignmentsToRemove.length
}
