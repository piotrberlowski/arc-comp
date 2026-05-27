import { buildEnrollmentByMembership } from "@/lib/championshipEnrollment"
import {
    calculateChampionshipCombinedStandings,
    type ChampionshipCombinedStandings,
    type ChampionshipDay,
    type ChampionshipRoundRef,
    type DayScoreInput,
    type RegisteredCompetitor,
} from "@/lib/championshipCombinedStandings"

export type ChampionshipStandingsRegistrationSource = {
    membershipNo: string
    competitorNumber: number
    name: string
    club: string
    ageGroupId: string
    genderGroup: string
    categoryId: string
    ageGroup: { name: string }
    category: { name: string }
}

export type ChampionshipStandingsRoundSource = ChampionshipRoundRef

export function mapChampionshipRegistrationsToStandings(
    registrations: ChampionshipStandingsRegistrationSource[]
): RegisteredCompetitor[] {
    return registrations.map((registration) => ({
        membershipNo: registration.membershipNo,
        competitorNumber: registration.competitorNumber,
        name: registration.name,
        club: registration.club,
        ageGroupId: registration.ageGroupId,
        ageGroupName: registration.ageGroup.name,
        categoryId: registration.categoryId,
        categoryName: registration.category.name,
        genderGroup: registration.genderGroup,
    }))
}

export function buildChampionshipStandingsDays(
    rounds: Pick<ChampionshipRoundRef, "dayOrder" | "tournamentId">[]
): ChampionshipDay[] {
    const dayOrders = [...new Set(rounds.map((round) => round.dayOrder))].sort((a, b) => a - b)

    return dayOrders.map((dayOrder) => ({
        dayOrder,
        tournamentId: rounds.find((round) => round.dayOrder === dayOrder)?.tournamentId ?? "",
        label: `Day ${dayOrder}`,
    }))
}

export function buildChampionshipCombinedStandingsFromChampionshipData({
    registrations,
    rounds,
    scores,
    enrollmentByTournament,
}: {
    registrations: ChampionshipStandingsRegistrationSource[]
    rounds: ChampionshipStandingsRoundSource[]
    scores: DayScoreInput[]
    enrollmentByTournament: Record<string, string[]>
}): ChampionshipCombinedStandings | null {
    const days = buildChampionshipStandingsDays(rounds)
    if (days.length === 0) {
        return null
    }

    const enrollmentByMembership = buildEnrollmentByMembership(rounds, enrollmentByTournament)

    return calculateChampionshipCombinedStandings(
        mapChampionshipRegistrationsToStandings(registrations),
        days,
        rounds,
        scores,
        enrollmentByMembership
    )
}
