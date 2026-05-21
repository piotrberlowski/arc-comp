import UnauthorizedChampionshipOrganizer from "@/components/UnauthorizedChampionshipOrganizer"
import {
    getChampionshipOrganizerClubs,
    hasChampionshipOrganizerAccess,
} from "@/lib/championshipOrganizerScope"
import { auth } from "../../auth"
import { notFound } from "next/navigation"
import { getChampionshipForOrganizer } from "../championshipActions"
import { competitorsRegisteredLabel } from "../competitorsRegisteredLabel"
import ChampionshipDaysSection from "./ChampionshipDaysSection"
import ChampionshipNameEdit from "./ChampionshipNameEdit"

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
        tournamentId: round.tournamentId,
        tournamentName: round.tournament.name,
        formatName: round.tournament.format.name,
        canRemove: round.tournament._count.participantScores === 0,
    }))

    return (
        <div className="w-full p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                <ChampionshipNameEdit championshipId={championship.id} initialName={championship.name} />
                <span className="badge badge-lg badge-info badge-outline">{championship.organizerClub}</span>
            </div>
            <p className="text-sm text-base-content/70 mb-2">
                {competitorsRegisteredLabel(championship._count.registrations)}.
            </p>
            <ChampionshipDaysSection
                championshipId={championship.id}
                championshipName={championship.name}
                organizerClub={championship.organizerClub}
                rounds={rounds}
            />
        </div>
    )
}
