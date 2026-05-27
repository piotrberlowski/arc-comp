import Link from "next/link"
import { getPublicChampionshipResults } from "../championshipResultsActions"
import PublicChampionshipResultsTabs from "./PublicChampionshipResultsTabs"

export default async function PublicChampionshipResultsPage({ params }: { params: Promise<{ cId: string }> }) {
    const { cId } = await params
    const data = await getPublicChampionshipResults(cId)

    const dayOrders = [...new Set(data.rounds.map((round) => round.dayOrder))].sort((a, b) => a - b)

    return (
        <div className="w-full p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="space-y-1">
                    <Link href="/results/championships" className="text-sm link link-hover">
                        ← All championship results
                    </Link>
                    <h1 className="text-3xl font-bold">{data.championship.name}</h1>
                    <p className="text-base-content/70">{data.championship.organizerClub}</p>
                </header>

                <PublicChampionshipResultsTabs
                    dayOrders={dayOrders}
                    rounds={data.rounds}
                    groupsByTournamentId={data.groupsByTournamentId}
                    standings={data.standings}
                />
            </div>
        </div>
    )
}
