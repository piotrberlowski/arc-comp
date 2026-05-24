import { getChampionshipOrganizerClubs } from "@/lib/championshipOrganizerScope"
import { notFound } from "next/navigation"
import { auth } from "../../auth"
import {
    getChampionshipForOrganizer,
    listChampionshipDayEnrollmentByTournament,
} from "../championshipActions"
import { buildEnrollmentByMembership } from "@/lib/championshipEnrollment"
import ChampionshipDaysSection from "./ChampionshipDaysSection"
import ChampionshipRosterSection from "./ChampionshipRosterSection"
import type { ChampionshipRegistrationRow } from "./ChampionshipRosterList"

export default async function ChampionshipDetailPage({ params }: { params: Promise<{ cId: string }> }) {
    const session = await auth()
    if (!session) {
        notFound()
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

    const enrollmentByMembership = buildEnrollmentByMembership(championship.rounds, enrollmentByTournament)

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
        <div className="p-4 space-y-8">
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
