import Link from "next/link"
import { parsePublicChampionshipDayQuery } from "@/lib/publicChampionshipUrls"
import { getPublicChampionshipResults } from "../championshipResultsActions"
import PublicChampionshipResultsTabs from "./PublicChampionshipResultsTabs"

export default async function PublicChampionshipResultsPage({
    params,
    searchParams,
}: {
    params: Promise<{ cId: string }>
    searchParams: Promise<{ day?: string }>
}) {
    const { cId } = await params
    const { day } = await searchParams
    const data = await getPublicChampionshipResults(cId)

    const dayOrders = [...new Set(data.rounds.map((round) => round.dayOrder))].sort((a, b) => a - b)
    const initialDayOrder = parsePublicChampionshipDayQuery(day)

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
                    championshipId={cId}
                    dayOrders={dayOrders}
                    rounds={data.rounds}
                    groupsByTournamentId={data.groupsByTournamentId}
                    standings={data.standings}
                    initialDayOrder={initialDayOrder}
                />
            </div>
        </div>
    )
}
