import { getChampionshipOrganizerClubs } from "@/lib/championshipOrganizerScope"
import { notFound } from "next/navigation"
import { auth } from "../../../auth"
import { getChampionshipCombinedStandings, getChampionshipForOrganizer } from "../../championshipActions"
import ChampionshipCombinedStandingsView from "../ChampionshipCombinedStandingsView"

export default async function ChampionshipStandingsPage({ params }: { params: Promise<{ cId: string }> }) {
    const session = await auth()
    if (!session) {
        notFound()
    }

    const { cId } = await params
    const clubs = getChampionshipOrganizerClubs(session.organizerRoles)
    const [championship, standings] = await Promise.all([
        getChampionshipForOrganizer(cId, clubs),
        getChampionshipCombinedStandings(cId, clubs),
    ])

    if (!championship || !standings) {
        notFound()
    }

    return (
        <div className="p-4">
            <ChampionshipCombinedStandingsView
                standings={standings}
                championshipId={championship.id}
                championshipName={championship.name}
                rangeCount={championship.rangeCount}
            />
        </div>
    )
}
