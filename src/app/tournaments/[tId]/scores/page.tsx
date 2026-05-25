import { ErrorContextBanner, ErrorContextProvider } from "@/components/errors/ErrorContext"
import { Suspense } from "react"
import { getTournamentById } from "../../tournamentActions"
import { TournamentEditContextProvider } from "../TournamentContext"
import TournamentEditForm from "../TournamentEditForm"
import TournamentNavigation from "../TournamentNavigation"
import { getTournamentResults } from "../scoreActions"
import ScoreEntryView from "./ScoreEntryView"

interface ScoreEntryPageProps {
    params: Promise<{
        tId: string
    }>
}

export default async function ScoreEntryPage({ params }: ScoreEntryPageProps) {
    const { tId } = await params
    const tournament = await getTournamentById(tId)
    const results = getTournamentResults(tId)

    return (
        <div className="w-full min-h-max">
            <TournamentEditContextProvider tournament={tournament}>
                <ErrorContextProvider>
                    <ErrorContextBanner placement="sticky-top" />
                    <TournamentEditForm />
                    <TournamentNavigation tournamentId={tId} />
                    <div className="border border-secondary border-solid w-full min-h-max">
                        <Suspense fallback={`Loading Scores`}>
                            <ScoreEntryView results={results} />
                        </Suspense>
                    </div>
                </ErrorContextProvider>
            </TournamentEditContextProvider>
        </div>
    )
}

