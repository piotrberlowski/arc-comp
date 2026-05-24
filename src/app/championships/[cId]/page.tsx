import UnauthorizedChampionshipOrganizer from "@/components/UnauthorizedChampionshipOrganizer"
import {
    getChampionshipOrganizerClubs,
    hasChampionshipOrganizerAccess,
} from "@/lib/championshipOrganizerScope"
import { auth } from "../../auth"
import { notFound } from "next/navigation"
import {
    getChampionshipForOrganizer,
    listChampionshipDayEnrollmentByTournament,
} from "../championshipActions"
import { competitorsRegisteredLabel } from "../competitorsRegisteredLabel"
import ChampionshipDaysSection from "./ChampionshipDaysSection"
import ChampionshipNameEdit from "./ChampionshipNameEdit"
import ChampionshipRosterSection from "./ChampionshipRosterSection"
import type { ChampionshipRegistrationRow } from "./ChampionshipRosterList"

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

    const enrollmentByTournament = (await listChampionshipDayEnrollmentByTournament(cId, clubs)) ?? {}
    const enrolledSet = new Set(Object.values(enrollmentByTournament).flat())

    const rosterDays = championship.rounds.map((round) => ({
        dayOrder: round.dayOrder,
        label: round.tournament.name,
    }))

    const enrollmentByMembership: Record<string, number[]> = {}
    for (const round of championship.rounds) {
        for (const membershipNo of enrollmentByTournament[round.tournamentId] ?? []) {
            enrollmentByMembership[membershipNo] ??= []
            enrollmentByMembership[membershipNo].push(round.dayOrder)
        }
    }

    const rounds = championship.rounds.map((round) => ({
        id: round.id,
        dayOrder: round.dayOrder,
        tournamentId: round.tournamentId,
        tournamentName: round.tournament.name,
        formatName: round.tournament.format.name,
        canRemove: round.tournament._count.participantScores === 0,
    }))

    const registrations: ChampionshipRegistrationRow[] = championship.registrations.map((registration) => ({
        id: registration.id,
        name: registration.name,
        membershipNo: registration.membershipNo,
        competitorNumber: registration.competitorNumber,
        ageGroupId: registration.ageGroupId,
        categoryId: registration.categoryId,
        genderGroup: registration.genderGroup,
        ageGroupName: registration.ageGroup.name,
        categoryName: registration.category.name,
        club: registration.club,
        canRemove: !enrolledSet.has(registration.membershipNo),
    }))

    return (
        <div className="w-full p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                <ChampionshipNameEdit
                    championshipId={championship.id}
                    initialName={championship.name}
                    readOnly={championship.isArchive}
                />
                <div className="flex flex-wrap gap-2">
                    {championship.isArchive ? (
                        <span className="badge badge-lg badge-warning">Archived</span>
                    ) : null}
                    <span className="badge badge-lg badge-info badge-outline">{championship.organizerClub}</span>
                </div>
            </div>
            <p className="text-sm text-base-content/70 mb-2">
                {competitorsRegisteredLabel(championship._count.registrations)}.
            </p>
            <ChampionshipDaysSection
                championshipId={championship.id}
                championshipName={championship.name}
                organizerClub={championship.organizerClub}
                rounds={rounds}
                readOnly={championship.isArchive}
            />
            <ChampionshipRosterSection
                championshipId={championship.id}
                registrations={registrations}
                days={rosterDays}
                enrollmentByMembership={enrollmentByMembership}
                readOnly={championship.isArchive}
            />
        </div>
    )
}
