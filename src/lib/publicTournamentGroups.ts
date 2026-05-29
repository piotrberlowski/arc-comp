import { sortByGroupAssignmentOrder } from "@/lib/groupAssignmentOrder"

export type PublicTournamentGroup = {
    groupNumber: number
    participants: {
        id: string
        membershipNo: string
        competitorNumber: number | null
        name: string
        club: string | null
        isCaptain: boolean
    }[]
}

export type PublicTournamentGroupsData = {
    tournament: {
        tournamentId: string
        tournamentName: string
        endCount: number
        groupSize: number
    }
    groups: PublicTournamentGroup[]
    unassigned: {
        id: string
        membershipNo: string
        competitorNumber: number | null
        name: string
        club: string | null
    }[]
}

type GroupParticipantRow = {
    id: string
    membershipNo: string
    competitorNumber: number | null
    name: string
    club: string | null
    groupAssignment: { groupNumber: number; isCaptain: boolean; positionInGroup: number } | null
}

export function groupsFromParticipants(
    endCount: number,
    participants: GroupParticipantRow[]
): { groups: PublicTournamentGroup[]; unassigned: PublicTournamentGroupsData["unassigned"] } {
    const buckets = Array.from({ length: endCount }, (_, index) => ({
        groupNumber: index + 1,
        participants: [] as GroupParticipantRow[],
    }))

    const unassigned: PublicTournamentGroupsData["unassigned"] = []

    for (const participant of participants) {
        const assignment = participant.groupAssignment
        if (!assignment) {
            unassigned.push({
                id: participant.id,
                membershipNo: participant.membershipNo,
                competitorNumber: participant.competitorNumber,
                name: participant.name,
                club: participant.club,
            })
            continue
        }

        const bucket = buckets[assignment.groupNumber - 1]
        if (!bucket) {
            continue
        }
        bucket.participants.push(participant)
    }

    const groups: PublicTournamentGroup[] = buckets.map((bucket) => ({
        groupNumber: bucket.groupNumber,
        participants: sortByGroupAssignmentOrder(bucket.participants).map((participant) => ({
            id: participant.id,
            membershipNo: participant.membershipNo,
            competitorNumber: participant.competitorNumber,
            name: participant.name,
            club: participant.club,
            isCaptain: participant.groupAssignment?.isCaptain ?? false,
        })),
    }))

    unassigned.sort((left, right) => left.name.localeCompare(right.name))
    return { groups, unassigned }
}
