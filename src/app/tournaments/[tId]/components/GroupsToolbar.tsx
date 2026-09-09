"use client"

import type { TournamentGroupsData } from "../groupActions"
import { useParticipantNameFilter } from "./ParticipantNameFilter"
import { useParticipantSortSelect } from "./ParticipantSortSelect"
import ParticipantVisibleCount from "./ParticipantVisibleCount"

export function useGroupsToolbar(groupsData: TournamentGroupsData) {
    const name = useParticipantNameFilter()
    const sort = useParticipantSortSelect()
    const allParticipants = [
        ...groupsData.unassignedParticipants,
        ...groupsData.groups.flatMap((group) => group.participants),
    ]
    const visibleUnassigned = sort.sort(name.filter(groupsData.unassignedParticipants))
    const visibleGroups = groupsData.groups.map((group) => ({
        ...group,
        assignedCount: group.participants.length,
        participants: name.filter(group.participants),
    }))

    return {
        visibleUnassigned,
        visibleGroups,
        toolbar: (
            <div className="flex flex-wrap items-center gap-2 w-full">
                {name.control}
                <div className="grow" />
                <ParticipantVisibleCount visible={name.filter(allParticipants).length} total={allParticipants.length} />
                {sort.control}
            </div>
        ),
    }
}
