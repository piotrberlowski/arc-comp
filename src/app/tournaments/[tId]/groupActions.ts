"use server"

import { GroupAssignment, Participant, RoundFormat, Tournament } from "@/generated/prisma/client"
import {
    groupUsesExplicitPositions,
    nextPositionInGroup,
    orderedParticipantIdsAfterMoveToCaptain,
    sortByGroupAssignmentOrder,
} from "@/lib/groupAssignmentOrder"
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

type TransactionClient = Parameters<Parameters<ReturnType<typeof prismaOrThrow>["$transaction"]>[0]>[0]

async function listGroupParticipants(
    tx: TransactionClient,
    tournamentId: string,
    groupNumber: number
) {
    return tx.participant.findMany({
        where: {
            tournamentId,
            groupAssignment: { groupNumber },
        },
        include: { groupAssignment: true },
    })
}

async function applyOrderedPositions(
    tx: TransactionClient,
    tournamentId: string,
    orderedParticipantIds: string[]
) {
    for (const [index, participantId] of orderedParticipantIds.entries()) {
        await tx.groupAssignment.update({
            where: {
                participantId_tournamentId: {
                    participantId,
                    tournamentId,
                },
            },
            data: {
                positionInGroup: index + 1,
                isCaptain: index === 0,
            },
        })
    }
}

async function reassignLegacyCaptain(
    tx: TransactionClient,
    tournamentId: string,
    groupNumber: number
) {
    const participants = await listGroupParticipants(tx, tournamentId, groupNumber)
    const firstRemaining = sortByGroupAssignmentOrder(participants)[0]
    if (!firstRemaining) {
        return
    }

    await tx.groupAssignment.updateMany({
        where: { tournamentId, groupNumber },
        data: { isCaptain: false },
    })
    await tx.groupAssignment.update({
        where: {
            participantId_tournamentId: {
                participantId: firstRemaining.id,
                tournamentId,
            },
        },
        data: { isCaptain: true },
    })
}

async function renumberGroupPositions(
    tx: TransactionClient,
    tournamentId: string,
    groupNumber: number
) {
    const participants = await listGroupParticipants(tx, tournamentId, groupNumber)
    const assignments = participants
        .map((participant) => participant.groupAssignment)
        .filter((assignment): assignment is GroupAssignment => assignment !== null)

    if (!groupUsesExplicitPositions(assignments)) {
        return
    }

    await applyOrderedPositions(
        tx,
        tournamentId,
        sortByGroupAssignmentOrder(participants).map((participant) => participant.id)
    )
}

async function syncOldGroupAfterMove(
    tx: TransactionClient,
    tournamentId: string,
    oldGroupNumber: number,
    wasCaptain: boolean
) {
    const remaining = await listGroupParticipants(tx, tournamentId, oldGroupNumber)
    if (remaining.length === 0) {
        return
    }

    const assignments = remaining
        .map((participant) => participant.groupAssignment)
        .filter((assignment): assignment is GroupAssignment => assignment !== null)

    if (groupUsesExplicitPositions(assignments)) {
        await renumberGroupPositions(tx, tournamentId, oldGroupNumber)
        return
    }

    if (wasCaptain) {
        await reassignLegacyCaptain(tx, tournamentId, oldGroupNumber)
    }
}

export async function getTournamentGroups(tournamentId: string): Promise<TournamentGroupsData> {
    const tournament = await prismaOrThrow("get tournament").tournament.findUnique({
        where: { id: tournamentId },
        include: {
            format: true,
            participants: {
                include: {
                    groupAssignment: true,
                },
            },
        },
    })

    if (!tournament) {
        throw new Error("Tournament not found")
    }

    const groups: GroupData[] = []
    for (let groupNumber = 1; groupNumber <= tournament.endCount; groupNumber++) {
        groups.push({
            groupNumber,
            participants: [],
        })
    }

    const assignedParticipants: Record<number, (Participant & { groupAssignment: GroupAssignment | null })[]> =
        {}
    const unassignedParticipants: (Participant & { groupAssignment: GroupAssignment | null })[] = []

    for (const participant of tournament.participants) {
        if (participant.groupAssignment) {
            const groupNum = participant.groupAssignment.groupNumber
            assignedParticipants[groupNum] ??= []
            assignedParticipants[groupNum].push(participant)
        } else {
            unassignedParticipants.push(participant)
        }
    }

    for (const group of groups) {
        const participants = assignedParticipants[group.groupNumber] ?? []
        group.participants = sortByGroupAssignmentOrder(participants)
    }

    return {
        tournament,
        groups,
        unassignedParticipants,
    }
}

export async function assignParticipantToGroup(
    participantId: string,
    tournamentId: string,
    groupNumber: number
): Promise<void> {
    const tournament = await prismaOrThrow("get tournament for validation").tournament.findUnique({
        where: { id: tournamentId },
        include: {
            groupAssignments: {
                where: { groupNumber },
            },
        },
    })

    if (!tournament) {
        throw new Error("Tournament not found")
    }

    const targetAssignments = tournament.groupAssignments.filter(
        (assignment) => assignment.participantId !== participantId
    )
    if (targetAssignments.length >= tournament.groupSize) {
        throw new Error(
            `Group ${groupNumber} is already full (${targetAssignments.length}/${tournament.groupSize})`
        )
    }

    const participant = await prismaOrThrow("get participant with assignment").participant.findUnique({
        where: { id: participantId },
        include: { groupAssignment: true },
    })

    if (!participant) {
        throw new Error("Participant not found")
    }

    const oldGroupNumber = participant.groupAssignment?.groupNumber
    const wasCaptain = participant.groupAssignment?.isCaptain ?? false

    if (oldGroupNumber === groupNumber) {
        return
    }

    const isFirstInGroup = targetAssignments.length === 0
    const usesPositions = groupUsesExplicitPositions(targetAssignments)
    const positionInGroup = usesPositions
        ? isFirstInGroup
            ? 1
            : nextPositionInGroup(targetAssignments)
        : 0

    await prismaOrThrow("assign participant to group in transaction").$transaction(async (tx) => {
        await tx.groupAssignment.upsert({
            where: {
                participantId_tournamentId: {
                    participantId,
                    tournamentId,
                },
            },
            update: {
                groupNumber,
                positionInGroup,
                isCaptain: isFirstInGroup,
            },
            create: {
                participantId,
                tournamentId,
                groupNumber,
                positionInGroup,
                isCaptain: isFirstInGroup,
            },
        })

        if (oldGroupNumber && oldGroupNumber !== groupNumber) {
            await syncOldGroupAfterMove(tx, tournamentId, oldGroupNumber, wasCaptain)
        }
    })

    revalidatePath(`/tournaments/${tournamentId}/groups`)
    revalidatePath(`/tournaments/${tournamentId}/scores`, "page")
}

export async function unassignParticipantFromGroup(
    participantId: string,
    tournamentId: string
): Promise<void> {
    const assignment = await prismaOrThrow("get assignment before delete").groupAssignment.findUnique({
        where: {
            participantId_tournamentId: {
                participantId,
                tournamentId,
            },
        },
    })

    if (!assignment) {
        return
    }

    const wasCaptain = assignment.isCaptain
    const groupNumber = assignment.groupNumber

    await prismaOrThrow("unassign participant from group in transaction").$transaction(async (tx) => {
        await tx.groupAssignment.delete({
            where: {
                participantId_tournamentId: {
                    participantId,
                    tournamentId,
                },
            },
        })

        const remaining = await listGroupParticipants(tx, tournamentId, groupNumber)
        if (remaining.length === 0) {
            return
        }

        const assignments = remaining
            .map((participant) => participant.groupAssignment)
            .filter((value): value is GroupAssignment => value !== null)

        if (groupUsesExplicitPositions(assignments)) {
            await renumberGroupPositions(tx, tournamentId, groupNumber)
            return
        }

        if (wasCaptain) {
            await reassignLegacyCaptain(tx, tournamentId, groupNumber)
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
        const participants = await listGroupParticipants(tx, tournamentId, groupNumber)
        const targetParticipant = participants.find((participant) => participant.id === participantId)
        if (!targetParticipant) {
            throw new Error("Participant is not assigned to the specified group")
        }

        const assignments = participants
            .map((participant) => participant.groupAssignment)
            .filter((assignment): assignment is GroupAssignment => assignment !== null)

        if (groupUsesExplicitPositions(assignments)) {
            const orderedParticipantIds = orderedParticipantIdsAfterMoveToCaptain(
                participants,
                participantId
            )
            await applyOrderedPositions(tx, tournamentId, orderedParticipantIds)
            return
        }

        await tx.groupAssignment.updateMany({
            where: { tournamentId, groupNumber },
            data: { isCaptain: false },
        })
        await tx.groupAssignment.update({
            where: {
                participantId_tournamentId: {
                    participantId,
                    tournamentId,
                },
            },
            data: {
                isCaptain: true,
                positionInGroup: 1,
            },
        })
    })

    revalidatePath(`/tournaments/${tournamentId}/groups`)
    revalidatePath(`/tournaments/${tournamentId}/scores`, "page")
}

export async function cleanupGroups(tournamentId: string): Promise<number> {
    const assignmentsToRemove = await prismaOrThrow("get non-checked-in assignments").groupAssignment.findMany({
        where: {
            tournamentId,
            participant: {
                checkedIn: false,
            },
        },
    })

    await prismaOrThrow("cleanup groups").groupAssignment.deleteMany({
        where: {
            tournamentId,
            participant: {
                checkedIn: false,
            },
        },
    })

    revalidatePath(`/tournaments/${tournamentId}/groups`)
    revalidatePath(`/tournaments/${tournamentId}/scores`, "page")

    return assignmentsToRemove.length
}
