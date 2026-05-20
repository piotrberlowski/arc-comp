import UnauthorizedChampionshipOrganizer from "@/components/UnauthorizedChampionshipOrganizer"
import {
    getChampionshipOrganizerClubs,
    hasChampionshipOrganizerAccess,
} from "@/lib/championshipOrganizerScope"
import { auth } from "../../auth"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getChampionshipForOrganizer } from "../championshipActions"
import { competitorsRegisteredLabel } from "../competitorsRegisteredLabel"
import ChampionshipRoundsList from "./ChampionshipRoundsList"

export default async function ChampionshipDetailPage({ params }: { params: Promise<{ cId: string }> }) {
    const session = await auth()

    if (!session || !hasChampionshipOrganizerAccess(session.organizerRoles)) {
        return <UnauthorizedChampionshipOrganizer />
    }

    const { cId } = await params
    const clubs = getChampionshipOrganizerClubs(session.organizerRoles)
    const championship = await getChampionshipForOrganizer(cId, clubs)

    if (!championship) {
        notFound()
    }

    const rounds = championship.rounds.map((round) => ({
        id: round.id,
        dayOrder: round.dayOrder,
        label: round.label,
        tournamentId: round.tournamentId,
        tournamentName: round.tournament.name,
    }))

    return (
        <div className="w-full p-4">
            <div className="breadcrumbs text-sm mb-4">
                <ul>
                    <li><Link href="/championships">My Championships</Link></li>
                    <li>{championship.name}</li>
                </ul>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                <h1 className="text-2xl font-semibold">{championship.name}</h1>
                <span className="badge badge-lg badge-info badge-outline">{championship.organizerClub}</span>
            </div>
            <p className="text-sm text-base-content/70 mb-2">
                {competitorsRegisteredLabel(championship._count.registrations)}.
            </p>
            <h2 className="text-lg font-medium mt-6 mb-3">Days (by order)</h2>
            <ChampionshipRoundsList rounds={rounds} />
        </div>
    )
}
