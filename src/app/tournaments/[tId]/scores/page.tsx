import { ErrorContextProvider } from "@/components/errors/ErrorContext"
import { Suspense } from "react"
import { getTournamentById } from "../../tournamentActions"
import { TournamentEditContextProvider } from "../TournamentContext"
import TournamentEditForm from "../TournamentEditForm"
import TournamentNavigation from "../TournamentNavigation"
import { getTournamentScores } from "../scoreActions"
import ScoreEntryView from "./ScoreEntryView"

interface ScoreEntryPageProps {
    params: Promise<{
        tId: string
    }>
}

export default async function ScoreEntryPage({ params }: ScoreEntryPageProps) {
    const { tId } = await params
    const tournament = await getTournamentById(tId)
    const scores = getTournamentScores(tId)

    return (
        <div className="w-full min-h-max">
            <TournamentEditContextProvider tournament={tournament}>
                <ErrorContextProvider>
                    <TournamentEditForm />
                    <TournamentNavigation tournamentId={tId} />
                    <div className="border border-secondary border-solid w-full min-h-max">
                        <Suspense fallback={`Loading Scores`}>
                            <ScoreEntryView scores={scores} />
                        </Suspense>
                    </div>
                </ErrorContextProvider>
            </TournamentEditContextProvider>
        </div>
    )
}

