"use client"

import type { ChampionshipDayLink } from "@/app/tournaments/tournamentActions"
import Link from "next/link"

export default function ChampionshipDayParticipantsNotice({
    championshipDay,
}: {
    championshipDay: ChampionshipDayLink
}) {
    return (
        <div role="note" className="alert alert-info alert-soft my-2">
            <span className="text-sm">
                Add and edit competitors on the{" "}
                <Link href={`/championships/${championshipDay.championshipId}`} className="link font-medium">
                    {championshipDay.championshipName}
                </Link>{" "}
                roster, then enroll them on this day.
            </span>
        </div>
    )
}
