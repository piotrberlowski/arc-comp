import UnauthorizedChampionshipOrganizer from "@/components/UnauthorizedChampionshipOrganizer"
import {
    getChampionshipOrganizerClubs,
    hasChampionshipOrganizerAccess,
} from "@/lib/championshipOrganizerScope"
import { notFound } from "next/navigation"
import { auth } from "../../auth"
import { getChampionshipForOrganizer } from "../championshipActions"
import ChampionshipDetailHeader from "./ChampionshipDetailHeader"
import ChampionshipNavigation from "./ChampionshipNavigation"

export default async function ChampionshipDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ cId: string }>
}) {
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

    return (
        <div className="w-full min-h-max p-4">
            <ChampionshipDetailHeader
                championshipId={championship.id}
                name={championship.name}
                organizerClub={championship.organizerClub}
                registrationCount={championship._count.registrations}
                isArchive={championship.isArchive}
                readOnly={championship.isArchive}
            />
            <ChampionshipNavigation championshipId={championship.id} />
            <div className="border border-secondary border-solid w-full min-h-max">{children}</div>
        </div>
    )
}
