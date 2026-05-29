export type GroupAssignmentSortFields = {
    id: string
    groupAssignment: {
        isCaptain: boolean
        positionInGroup: number
    } | null
}

export function compareGroupAssignmentOrder(
    left: GroupAssignmentSortFields,
    right: GroupAssignmentSortFields
): number {
    const leftPosition = left.groupAssignment?.positionInGroup ?? 0
    const rightPosition = right.groupAssignment?.positionInGroup ?? 0
    const leftPositioned = leftPosition > 0
    const rightPositioned = rightPosition > 0

    if (leftPositioned && rightPositioned) {
        return leftPosition - rightPosition
    }
    if (leftPositioned && !rightPositioned) {
        return -1
    }
    if (!leftPositioned && rightPositioned) {
        return 1
    }

    const leftCaptain = left.groupAssignment?.isCaptain ?? false
    const rightCaptain = right.groupAssignment?.isCaptain ?? false
    if (leftCaptain && !rightCaptain) {
        return -1
    }
    if (!leftCaptain && rightCaptain) {
        return 1
    }

    return left.id.localeCompare(right.id)
}

export function sortByGroupAssignmentOrder<T extends GroupAssignmentSortFields>(participants: T[]): T[] {
    return [...participants].sort(compareGroupAssignmentOrder)
}

export function groupUsesExplicitPositions(
    assignments: { positionInGroup: number }[]
): boolean {
    return assignments.some((assignment) => assignment.positionInGroup > 0)
}

export function nextPositionInGroup(assignments: { positionInGroup: number }[]): number {
    const maxPosition = assignments.reduce(
        (max, assignment) => Math.max(max, assignment.positionInGroup),
        0
    )
    return maxPosition > 0 ? maxPosition + 1 : 0
}

export function orderedParticipantIdsAfterMoveToCaptain<T extends GroupAssignmentSortFields>(
    participants: T[],
    captainParticipantId: string
): string[] {
    const sorted = sortByGroupAssignmentOrder(participants)
    const withoutCaptain = sorted.filter((participant) => participant.id !== captainParticipantId)
    return [captainParticipantId, ...withoutCaptain.map((participant) => participant.id)]
}

export function orderedParticipantIdsAfterRemoval<T extends GroupAssignmentSortFields>(
    participants: T[],
    removedParticipantId: string
): string[] {
    return sortByGroupAssignmentOrder(participants)
        .filter((participant) => participant.id !== removedParticipantId)
        .map((participant) => participant.id)
}
