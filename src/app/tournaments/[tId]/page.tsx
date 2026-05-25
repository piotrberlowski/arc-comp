import { ErrorContextBanner, ErrorContextProvider } from "@/components/errors/ErrorContext"
import { getTournamentById, getChampionshipDayLinkForTournament } from "../tournamentActions"
import ParticipantsSection from "./ParticipantsSection"
import { TournamentEditContextProvider } from "./TournamentContext"
import TournamentEditForm from "./TournamentEditForm"
import TournamentNavigation from "./TournamentNavigation"
import { listParticipants } from "./participantActions"

export default async function TournamentDetailsPage({ params }: { params: Promise<{ tId: string }> }) {
    const tournament = await params.then(p => getTournamentById(p.tId)).catch(
        e => {
            console.error("Failed to load tournament:", e)
            return `${e}`
        }
    )

    if (typeof (tournament) === "string") {
        return <div className="alert alert-error alert-soft" >
            <span>Unable to display the tournament: {tournament}</span>
        </div>
    }

    const participants = await listParticipants(tournament.id)
    const championshipDay = await getChampionshipDayLinkForTournament(tournament.id)

    return (
        <div className="w-full min-h-max">
            <TournamentEditContextProvider tournament={tournament}>
                <ErrorContextProvider>
                    <ErrorContextBanner placement="sticky-top" />
                    <TournamentEditForm />
                    <TournamentNavigation tournamentId={tournament.id} />
                    <div className="border border-secondary border-solid w-full min-h-max">
                        <ParticipantsSection
                            tId={tournament.id}
                            participants={participants}
                            championshipDay={championshipDay}
                        />
                    </div>
                </ErrorContextProvider>
            </TournamentEditContextProvider>
        </div>
    )
}