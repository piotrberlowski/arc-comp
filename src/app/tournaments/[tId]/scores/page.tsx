import { ErrorContextProvider } from "@/components/errors/ErrorContext"
import { getTournamentScores } from "../scoreActions"
import { TournamentEditContextProvider } from "../TournamentContext"
import TournamentEditForm from "../TournamentEditForm"
import TournamentNavigation from "../TournamentNavigation"
import ScoreEntryView from "./ScoreEntryView"

interface ScoreEntryPageProps {
    params: Promise<{
        tId: string
    }>
}

export default async function ScoreEntryPage({ params }: ScoreEntryPageProps) {
    const { tId } = await params
    const scoresData = await getTournamentScores(tId)

    return (
        <div className="w-full min-h-max">
            <TournamentEditContextProvider tournament={scoresData.tournament}>
                <ErrorContextProvider>
                    <TournamentEditForm />
                    <TournamentNavigation tournamentId={tId} />
                    <div className="border border-secondary border-solid w-full min-h-max">
                        <ScoreEntryView scoresData={scoresData} />
                    </div>
                </ErrorContextProvider>
            </TournamentEditContextProvider>
        </div>
    )
}

