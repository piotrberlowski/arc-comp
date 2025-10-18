import UnauthorizedOrganizer from "@/components/Unauthorized"
import { auth } from "../auth"
import TournamentsList from "./TournamentsList"

export default async function TournamentsPage() {
    const session = await auth()

    if (!session || session.organizerRoles.length == 0) {
        return (<UnauthorizedOrganizer />)
    }

    const userClubs = session.organizerRoles.map(r => r.club)

    return (
        <div className="w-full">
            <TournamentsList clubs={userClubs} />
        </div>
    )
}