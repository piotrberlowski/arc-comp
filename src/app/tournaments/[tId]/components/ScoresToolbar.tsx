"use client"

import type { ParticipantWithResult } from "../scoreActions"
import { useParticipantNameFilter } from "./ParticipantNameFilter"
import ParticipantVisibleCount from "./ParticipantVisibleCount"

export function useScoresToolbar(participants: ParticipantWithResult[]) {
    const name = useParticipantNameFilter()
    const visible = name.filter(participants)

    return {
        visible,
        toolbar: (
            <div className="flex flex-wrap items-center gap-2 w-full">
                {name.control}
                <div className="grow" />
                <ParticipantVisibleCount visible={visible.length} total={participants.length} />
            </div>
        ),
    }
}
