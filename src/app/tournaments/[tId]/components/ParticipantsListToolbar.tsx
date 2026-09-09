"use client"

import { Participant } from "@/generated/prisma/browser"
import { useParticipantCheckinFilter } from "./ParticipantCheckinFilter"
import { useParticipantNameFilter } from "./ParticipantNameFilter"
import { useParticipantSortSelect } from "./ParticipantSortSelect"
import ParticipantVisibleCount from "./ParticipantVisibleCount"

export function useParticipantsListToolbar(participants: Participant[]) {
    const checkIn = useParticipantCheckinFilter()
    const name = useParticipantNameFilter()
    const sort = useParticipantSortSelect()
    const visible = sort.sort(checkIn.filter(name.filter(participants)))

    return {
        visible,
        toolbar: (
            <div className="flex flex-wrap items-center gap-2 w-full">
                {checkIn.control}
                {name.control}
                <div className="grow" />
                <ParticipantVisibleCount visible={visible.length} total={participants.length} />
                {sort.control}
            </div>
        ),
    }
}
