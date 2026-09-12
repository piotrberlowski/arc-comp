import { championshipCategoryKey } from "@/lib/championshipCombinedStandings"

export type ChampionshipMedalCount = {
    gold: number
    silver: number
    bronze: number
}

type MedalCategoryRegistration = {
    ageGroupId: string
    genderGroup: string
    categoryId: string
}

const emptyMedalCount: ChampionshipMedalCount = { gold: 0, silver: 0, bronze: 0 }

function medalsForOccupiedCategory(participantCount: number): ChampionshipMedalCount {
    return {
        gold: 1,
        silver: participantCount >= 2 ? 1 : 0,
        bronze: participantCount >= 3 ? 1 : 0,
    }
}

function addMedalCounts(
    left: ChampionshipMedalCount,
    right: ChampionshipMedalCount
): ChampionshipMedalCount {
    return {
        gold: left.gold + right.gold,
        silver: left.silver + right.silver,
        bronze: left.bronze + right.bronze,
    }
}

function occupiedCategorySizes(registrations: MedalCategoryRegistration[]): number[] {
    const sizes = new Map<string, number>()

    for (const registration of registrations) {
        const key = championshipCategoryKey(
            registration.ageGroupId,
            registration.genderGroup,
            registration.categoryId
        )
        sizes.set(key, (sizes.get(key) ?? 0) + 1)
    }

    return [...sizes.values()]
}

export function countChampionshipMedals(
    registrations: MedalCategoryRegistration[]
): ChampionshipMedalCount {
    return occupiedCategorySizes(registrations).reduce(
        (totals, participantCount) => addMedalCounts(totals, medalsForOccupiedCategory(participantCount)),
        emptyMedalCount
    )
}
