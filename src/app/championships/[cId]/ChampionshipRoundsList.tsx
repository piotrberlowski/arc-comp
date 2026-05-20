import Link from "next/link"

export type ChampionshipRoundRow = {
    id: string
    dayOrder: number
    label: string | null
    tournamentId: string
    tournamentName: string
}

export default function ChampionshipRoundsList({ rounds }: { rounds: ChampionshipRoundRow[] }) {
    if (rounds.length === 0) {
        return <p className="text-base-content/70">No tournament days linked yet.</p>
    }

    return (
        <ul className="menu bg-base-200 rounded-box w-full max-w-xl">
            {rounds.map((round) => (
                <li key={round.id}>
                    <Link href={`/tournaments/${round.tournamentId}`} className="flex flex-col items-stretch gap-0.5 py-2">
                        <span className="font-medium">
                            Day {round.dayOrder}
                            {round.label ? ` — ${round.label}` : ""}
                        </span>
                        <span className="text-sm opacity-80 truncate">{round.tournamentName}</span>
                    </Link>
                </li>
            ))}
        </ul>
    )
}
