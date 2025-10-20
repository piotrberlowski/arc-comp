import TournamentResultsView from "./TournamentResultsView"
import { getTournamentResults } from "./resultsActions"

interface ResultsPageProps {
    params: Promise<{
        rId: string
    }>
}

export default async function ResultsPage({ params }: ResultsPageProps) {
    const { rId } = await params
    const tournamentData = await getTournamentResults(rId)

    return (
        <div className="w-full p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">{tournamentData.tournament.name}</h1>
                    <div className="flex items-center gap-4 text-base-content/70 mt-2">
                        <span>{tournamentData.tournament.date.toLocaleDateString()}</span>
                        <span>{tournamentData.tournament.organizerClub}</span>
                        <span>{tournamentData.tournament.format.name}</span>
                    </div>
                </div>

                <TournamentResultsView tournamentData={tournamentData} />
            </div>
        </div>
    )
}
