import type { ChampionshipRegistration, GenderGroup } from "@/generated/prisma/client"

export type ChampionshipRegistrationProfile = Pick<
    ChampionshipRegistration,
    "name" | "membershipNo" | "competitorNumber" | "ageGroupId" | "categoryId" | "club" | "genderGroup"
>

export function participantDataFromRegistration(
    registration: ChampionshipRegistrationProfile,
    tournamentId: string
) {
    return {
        tournamentId,
        name: registration.name,
        membershipNo: registration.membershipNo,
        competitorNumber: registration.competitorNumber,
        ageGroupId: registration.ageGroupId,
        categoryId: registration.categoryId,
        club: registration.club,
        genderGroup: registration.genderGroup as GenderGroup,
        checkedIn: false,
    }
}

export function participantUpdateFromRegistration(registration: ChampionshipRegistrationProfile) {
    return {
        name: registration.name,
        competitorNumber: registration.competitorNumber,
        ageGroupId: registration.ageGroupId,
        categoryId: registration.categoryId,
        club: registration.club,
        genderGroup: registration.genderGroup as GenderGroup,
    }
}

export function buildEnrollmentByMembership(
    rounds: { tournamentId: string; dayOrder: number }[],
    enrollmentByTournament: Record<string, string[]>
): Record<string, number[]> {
    const enrollmentByMembership: Record<string, number[]> = {}

    for (const round of rounds) {
        for (const membershipNo of enrollmentByTournament[round.tournamentId] ?? []) {
            enrollmentByMembership[membershipNo] ??= []
            enrollmentByMembership[membershipNo].push(round.dayOrder)
        }
    }

    return enrollmentByMembership
}
