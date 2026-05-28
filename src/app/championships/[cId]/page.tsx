import { championshipDivisionKey } from "@/lib/championshipDivision"
import { mapDivisionRangeAssignments } from "@/lib/championshipRangeRules"
import { getChampionshipOrganizerClubs } from "@/lib/championshipOrganizerScope"
import {
    areChampionshipRangeAssignmentsComplete,
    buildChampionshipEnrollmentEligibility,
    buildEnrollmentByMembership,
    listChampionshipRosterDays,
} from "@/lib/championshipEnrollment"
import { notFound } from "next/navigation"
import { auth } from "../../auth"
import { buildDivisionRangeMatrixFromShell } from "@/lib/championshipDivisionRangeMatrix"
import {
    getChampionshipForOrganizer,
    listChampionshipDayEnrollmentByTournament,
} from "../championshipActions"
import ChampionshipDaysSection from "./ChampionshipDaysSection"
import ChampionshipDivisionRangeMatrix, {
    type ChampionshipMatrixRegistration,
} from "./ChampionshipDivisionRangeMatrix"
import ChampionshipRosterSection from "./ChampionshipRosterSection"
import ChampionshipSetupTabs from "./ChampionshipSetupTabs"
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

    const dayOrders = [...new Set(championship.rounds.map((round) => round.dayOrder))].sort((a, b) => a - b)
    const rosterDays = listChampionshipRosterDays(
        championship.rounds.map((round) => ({
            dayOrder: round.dayOrder,
            label: `Day ${round.dayOrder}`,
        }))
    )
    const divisionRangeAssignments = mapDivisionRangeAssignments(championship.divisionRanges)
    const assignmentsComplete = areChampionshipRangeAssignmentsComplete(
        championship.registrations,
        dayOrders,
        divisionRangeAssignments,
        championship.rangeCount
    )
    const enrollmentEligibility = buildChampionshipEnrollmentEligibility(
        championship.registrations,
        dayOrders,
        divisionRangeAssignments,
        championship.rangeCount
    )

    const enrollmentByMembership = buildEnrollmentByMembership(championship.rounds, enrollmentByTournament)

    const rounds = championship.rounds.map((round) => ({
        id: round.id,
        dayOrder: round.dayOrder,
        rangeNumber: round.rangeNumber,
        tournamentId: round.tournamentId,
        tournamentName: round.tournament.name,
        tournamentDate: round.tournament.date,
        formatName: round.tournament.format.name,
        canRemove: championship.rounds
            .filter((item) => item.dayOrder === round.dayOrder)
            .every((item) => item.tournament._count.participantScores === 0),
    }))

    const needsRangeAssignments =
        championship.rangeCount > 1 && championship.registrations.length > 0 && dayOrders.length > 0
    const divisionRangeMatrix = needsRangeAssignments
        ? buildDivisionRangeMatrixFromShell(championship)
        : null

    const matrixRegistrations: ChampionshipMatrixRegistration[] = championship.registrations.map(
        (registration) => ({
            divisionKey: championshipDivisionKey(
                registration.ageGroupId,
                registration.genderGroup,
                registration.categoryId
            ),
            name: registration.name,
            membershipNo: registration.membershipNo,
            competitorNumber: registration.competitorNumber,
            club: registration.club,
        })
    )

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
                rangeCount={championship.rangeCount}
                rangeConfigs={championship.rangeConfigs.map((rangeConfig) => ({
                    rangeNumber: rangeConfig.rangeNumber,
                    formatName: rangeConfig.format.name,
                }))}
                rounds={rounds}
                readOnly={championship.isArchive}
            />
            <ChampionshipSetupTabs
                showRangeAssignments={divisionRangeMatrix !== null && divisionRangeMatrix.rows.length > 0}
                rangeAssignment={
                    <ChampionshipDivisionRangeMatrix
                        key="division-range-matrix"
                        championshipId={championship.id}
                        initialMatrix={divisionRangeMatrix}
                        registrations={matrixRegistrations}
                        readOnly={championship.isArchive}
                    />
                }
                roster={
                    <ChampionshipRosterSection
                        key="competitor-roster"
                        championshipId={championship.id}
                        registrations={registrations}
                        rosterDays={rosterDays}
                        enrollmentByMembership={enrollmentByMembership}
                        enrollmentEligibility={enrollmentEligibility}
                        assignmentsComplete={assignmentsComplete}
                        rangeCount={championship.rangeCount}
                        readOnly={championship.isArchive}
                    />
                }
            />
        </div>
    )
}
