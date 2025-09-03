import UnauthorizedOrganizer from "@/components/Unauthorized"
import { auth } from "../auth"
import { listTournamentsForClubs } from "./tournamentActions"
import TournamentCard from "./TournamentCard"
import TournamentHeader from "./TournamentHeader"
import TournamentsList from "./TournamentsList"

export default async function TournamentsPage({includeArchive}:{includeArchive: boolean}) {
    const session = await auth()

    if (!session || session.organizerRoles.length == 0) {
        return (<UnauthorizedOrganizer/>)
    }

    const userClubs = session.organizerRoles.map(r => r.club)

    return (
        <div className="w-full">
            <TournamentsList clubs={userClubs} />
        </div>
    )
}