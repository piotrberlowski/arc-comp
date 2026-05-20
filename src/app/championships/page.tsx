import UnauthorizedChampionshipOrganizer from "@/components/UnauthorizedChampionshipOrganizer"
import { hasChampionshipOrganizerAccess } from "@/lib/championshipOrganizerScope"
import { auth } from "../auth"
import ChampionshipsList from "./ChampionshipsList"

export default async function ChampionshipsPage() {
    const session = await auth()

    if (!session || !hasChampionshipOrganizerAccess(session.organizerRoles)) {
        return <UnauthorizedChampionshipOrganizer />
    }

    return (
        <div className="w-full p-4">
            <h1 className="text-2xl font-semibold mb-2">My Championships</h1>
            <p className="text-sm text-base-content/70 mb-4">
                Multi-day events: open a championship to see days and jump to each tournament.
            </p>
            <ChampionshipsList />
        </div>
    )
}
