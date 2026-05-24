import { getChampionshipOrganizerClubs } from "@/lib/championshipOrganizerScope"
import { notFound } from "next/navigation"
import { auth } from "../../../auth"
import { getChampionshipCombinedStandings } from "../../championshipActions"
import ChampionshipCombinedStandingsView from "../ChampionshipCombinedStandingsView"

export default async function ChampionshipStandingsPage({ params }: { params: Promise<{ cId: string }> }) {
    const session = await auth()
    if (!session) {
        notFound()
    }

    const { cId } = await params
    const clubs = getChampionshipOrganizerClubs(session.organizerRoles)
    const standings = await getChampionshipCombinedStandings(cId, clubs)

    if (!standings) {
        notFound()
    }

    return (
        <div className="p-4">
            <ChampionshipCombinedStandingsView standings={standings} />
        </div>
    )
}
