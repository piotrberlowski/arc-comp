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
