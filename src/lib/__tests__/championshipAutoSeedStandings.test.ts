import {
    buildCompetitorStandingsByCategory,
    compareCompetitorsForAutoSeed,
    type RegisteredCompetitor,
} from "@/lib/championshipCombinedStandings"
import { SCORE_DNC, SCORE_DNF } from "@/lib/scoreUtils"

describe("compareCompetitorsForAutoSeed", () => {
    const registration = (
        membershipNo: string,
        competitorNumber: number
    ): RegisteredCompetitor => ({
        membershipNo,
        competitorNumber,
        name: membershipNo,
        club: "A",
        ageGroupId: "age",
        ageGroupName: "Adult",
        categoryId: "cat",
        categoryName: "Recurve",
        genderGroup: "M",
    })

    const days = [{ dayOrder: 1, tournamentId: "t1", label: "Day 1" }]
    const rounds = [{ dayOrder: 1, rangeNumber: 1, tournamentId: "t1" }]

    function standingFor(membershipNo: string, rawScore: number) {
        const byCategory = buildCompetitorStandingsByCategory(
            [registration(membershipNo, 1)],
            days,
            rounds,
            [{ tournamentId: "t1", membershipNo, rawScore }],
            { [membershipNo]: [{ dayOrder: 1, rangeNumber: 1 }] }
        )
        return byCategory.get("ageMcat")?.[0]
    }

    it("ranks completed scores ahead of DNC and DNF", () => {
        const scored = standingFor("M-1", 300)!
        const dnc = standingFor("M-2", SCORE_DNC)!
        const dnf = standingFor("M-3", SCORE_DNF)!

        expect(compareCompetitorsForAutoSeed(scored, dnc, [1])).toBeLessThan(0)
        expect(compareCompetitorsForAutoSeed(scored, dnf, [1])).toBeLessThan(0)
        expect(compareCompetitorsForAutoSeed(dnc, dnf, [1])).toBeLessThan(0)
    })
})
