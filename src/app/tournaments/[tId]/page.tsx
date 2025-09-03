import { getTournamentById } from "../tournamentActions"
import AddParticipantForm from "./AddParticipantForm"
import ParticipantsList from "./ParticipantsList"
import { TournamentEditContextProvider } from "./TournamentContext"
import TournamentEditForm from "./TournamentEditForm"
import { listParticipants } from "./participantActions"

export default async function TournamentDetailsPage({ params }: { params: Promise<{ tId: string }> }) {
    const tournament = await params.then(p => getTournamentById(p.tId)).catch(
        e => {
            return `${e}`
        }
    )

    if (typeof (tournament) === "string") {
        return <div className="alert alert-error alert-soft" >
            <span>Unable to display the tournament: {tournament}</span>
        </div>
    }

    const participants = await listParticipants(tournament.id)

    return (
        <div className="w-full min-h-max">
            <TournamentEditContextProvider tournament={tournament}>
                <TournamentEditForm />
                <AddParticipantForm tId={tournament.id} />
                <ParticipantsList participants={participants} />
            </TournamentEditContextProvider>
        </div>
    )
}