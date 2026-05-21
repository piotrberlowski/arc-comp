import Link from "next/link"
import type { ChampionshipDayLink } from "../tournamentActions"

export default function ChampionshipDayBackNav({ link }: { link: ChampionshipDayLink }) {
    return (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-1">
            <Link href={`/championships/${link.championshipId}`} className="btn btn-sm btn-ghost">
                ← Back to {link.championshipName}
            </Link>
            <span className="text-sm text-base-content/70">Day {link.dayOrder}</span>
        </div>
    )
}
