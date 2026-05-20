import UnauthorizedChampionshipOrganizer from "@/components/UnauthorizedChampionshipOrganizer"
import {
    getChampionshipOrganizerClubs,
    hasChampionshipOrganizerAccess,
} from "@/lib/championshipOrganizerScope"
import { auth } from "../auth"
import ChampionshipsHeader from "./ChampionshipsHeader"
import ChampionshipsList from "./ChampionshipsList"

export default async function ChampionshipsPage() {
    const session = await auth()

    if (!session || !hasChampionshipOrganizerAccess(session.organizerRoles)) {
        return <UnauthorizedChampionshipOrganizer />
    }

    const clubs = getChampionshipOrganizerClubs(session.organizerRoles)

    return (
        <div className="w-full p-4">
            <ChampionshipsHeader clubs={clubs} />
            <p className="text-sm text-base-content/70 mb-4">
                Multi-day events: open a championship to see days and jump to each tournament.
            </p>
            <ChampionshipsList />
        </div>
    )
}
