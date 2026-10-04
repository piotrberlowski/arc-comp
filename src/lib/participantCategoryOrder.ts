import { compareCombinedStandingsCategories } from "@/lib/championshipCombinedStandings"

type CategorizedParticipant = {
    category: { name: string }
    ageGroup: { name: string }
    genderGroup: string
}

function toStandingsCategory({ category, ageGroup, genderGroup }: CategorizedParticipant) {
    return { categoryName: category.name, ageGroupName: ageGroup.name, genderGroup }
}

/** Orders participants' categories as in the championship results: bow style, age group, gender. */
export function compareParticipantCategories(a: CategorizedParticipant, b: CategorizedParticipant): number {
    return compareCombinedStandingsCategories(toStandingsCategory(a), toStandingsCategory(b))
}
