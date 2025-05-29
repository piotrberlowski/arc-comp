import UnauthorizedOrganizer from "@/components/Unauthorized"
import { auth } from "../auth"
import { listTournamentsForClubs } from "./tournamentActions"
import TournamentCard from "./TournamentCard"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import TournamentHeader from "./TournamentHeader"

export default async function TournamentsPage() {
    const session = await auth()

    if (!session || session.organizerRoles.length == 0) {
        return (<UnauthorizedOrganizer/>)
    }

    const tournaments = await listTournamentsForClubs(session.organizerRoles.map(r => r.club))

    return (
        <div className="w-full">
            <TournamentHeader/>
            <div className="divider"/>
            <div className="w-full flex flex-wrap gap-4 mt-5 bg-primary p-5 rounded-sm justify-center">
                {tournaments && tournaments.map(t => (<TournamentCard key={`tournament-${t.id}`} tournament={t}/>))}
            </div>   
        </div>
    )
}