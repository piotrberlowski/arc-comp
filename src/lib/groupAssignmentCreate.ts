import type { GroupSeedAssignment } from "@/lib/championshipAutoSeed"

export type GroupAssignmentCreateRow = {
    participantId: string
    tournamentId: string
    groupNumber: number
    positionInGroup: number
    isCaptain: boolean
}

export function mapSeedAssignmentsToCreateRows(
    tournamentId: string,
    assignments: GroupSeedAssignment[]
): GroupAssignmentCreateRow[] {
    const rows = assignments.map((assignment) => ({
        participantId: assignment.participantId,
        tournamentId,
        groupNumber: assignment.groupNumber,
        positionInGroup: assignment.positionInGroup,
        isCaptain: assignment.isCaptain,
    }))

    const participantIds = rows.map((row) => row.participantId)
    if (new Set(participantIds).size !== participantIds.length) {
        throw new Error("Auto-seed produced duplicate participant assignments")
    }

    for (const row of rows) {
        if (!Number.isInteger(row.groupNumber) || row.groupNumber < 1) {
            throw new Error(`Invalid target number for participant ${row.participantId}`)
        }
        if (!Number.isInteger(row.positionInGroup) || row.positionInGroup < 1) {
            throw new Error(`Invalid position in group for participant ${row.participantId}`)
        }
    }

    return rows
}

export async function createGroupAssignments(
    tx: {
        groupAssignment: {
            createMany: (args: {
                data: GroupAssignmentCreateRow[]
            }) => Promise<unknown>
        }
    },
    rows: GroupAssignmentCreateRow[]
) {
    if (rows.length === 0) {
        return
    }

    await tx.groupAssignment.createMany({ data: rows })
}
