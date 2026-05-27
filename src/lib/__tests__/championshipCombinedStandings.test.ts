import {
    calculateChampionshipCombinedStandings,
    championshipCategoryKey,
    compareCombinedStandingsCategories,
} from "@/lib/championshipCombinedStandings"
import { SCORE_DNC, toScore } from "@/lib/scoreUtils"

describe("championshipCombinedStandings", () => {
    const days = [
        { dayOrder: 1, tournamentId: "t1", label: "Day 1" },
        { dayOrder: 2, tournamentId: "t2", label: "Day 2" },
    ]

    const rounds = [
        { dayOrder: 1, rangeNumber: 1, tournamentId: "t1" },
        { dayOrder: 2, rangeNumber: 1, tournamentId: "t2" },
    ]

    const registrations = [
        {
            membershipNo: "M-001",
            competitorNumber: 1,
            name: "Alex",
            club: "Club A",
            ageGroupId: "age-1",
            ageGroupName: "Adult",
            categoryId: "cat-1",
            categoryName: "Barebow Compound",
            genderGroup: "M",
        },
        {
            membershipNo: "M-002",
            competitorNumber: 2,
            name: "Blair",
            club: "Club B",
            ageGroupId: "age-1",
            ageGroupName: "Adult",
            categoryId: "cat-1",
            categoryName: "Barebow Compound",
            genderGroup: "M",
        },
    ]

    const enrollmentByMembership = {
        "M-001": [
            { dayOrder: 1, rangeNumber: 1 },
            { dayOrder: 2, rangeNumber: 1 },
        ],
        "M-002": [
            { dayOrder: 1, rangeNumber: 1 },
            { dayOrder: 2, rangeNumber: 1 },
        ],
    }

    function calculate(
        scores: { tournamentId: string; membershipNo: string; rawScore: number | null }[],
        enrollment = enrollmentByMembership
    ) {
        return calculateChampionshipCombinedStandings(registrations, days, rounds, scores, enrollment)
    }

    it("sums completed day scores across enrolled days", () => {
        const standings = calculate([
            { tournamentId: "t1", membershipNo: "M-001", rawScore: 290 },
            { tournamentId: "t2", membershipNo: "M-001", rawScore: 295 },
            { tournamentId: "t1", membershipNo: "M-002", rawScore: 280 },
            { tournamentId: "t2", membershipNo: "M-002", rawScore: 285 },
        ])

        const competitors = standings?.complete[0]?.competitors ?? []
        const alex = competitors.find((entry) => entry.membershipNo === "M-001")
        const blair = competitors.find((entry) => entry.membershipNo === "M-002")

        expect(alex?.totalLabel).toBe("585")
        expect(blair?.totalLabel).toBe("565")
    })

    it("includes shootoff decimals in the total", () => {
        const standings = calculateChampionshipCombinedStandings(
            [registrations[0]],
            days,
            rounds,
            [
                { tournamentId: "t1", membershipNo: "M-001", rawScore: toScore(290, 500) },
                { tournamentId: "t2", membershipNo: "M-001", rawScore: 295 },
            ],
            enrollmentByMembership
        )

        expect(standings?.complete[0]?.competitors[0]?.totalLabel).toBe("585.5")
    })

    it("does not add DNC to the combined total", () => {
        const standings = calculateChampionshipCombinedStandings(
            [registrations[0]],
            days,
            rounds,
            [
                { tournamentId: "t1", membershipNo: "M-001", rawScore: SCORE_DNC },
                { tournamentId: "t2", membershipNo: "M-001", rawScore: 295 },
            ],
            enrollmentByMembership
        )

        expect(standings?.complete[0]?.competitors[0]?.totalLabel).toBe("295")
    })

    it("labels not enrolled and pending days", () => {
        const standings = calculateChampionshipCombinedStandings(
            [registrations[0]],
            days,
            rounds,
            [{ tournamentId: "t1", membershipNo: "M-001", rawScore: 290 }],
            { "M-001": [{ dayOrder: 1, rangeNumber: 1 }] }
        )

        const labels = standings?.complete[0]?.competitors[0]?.dayScoreLabels ?? []
        expect(labels[0]).toBe("290")
        expect(labels[1]).toBe("")
    })

    it("sorts complete competitors by total then name", () => {
        const standings = calculate([
            { tournamentId: "t1", membershipNo: "M-001", rawScore: 290 },
            { tournamentId: "t2", membershipNo: "M-001", rawScore: 295 },
            { tournamentId: "t1", membershipNo: "M-002", rawScore: 280 },
            { tournamentId: "t2", membershipNo: "M-002", rawScore: 285 },
        ])

        expect(standings?.complete[0]?.competitors.map((entry) => entry.membershipNo)).toEqual([
            "M-001",
            "M-002",
        ])
    })

    it("groups competitors by category", () => {
        const standings = calculate([])

        expect(standings?.inProgress).toHaveLength(1)
        expect(standings?.inProgress[0]?.competitors).toHaveLength(2)
    })

    it("builds category keys", () => {
        expect(championshipCategoryKey("age-1", "M", "cat-1")).toBe("age-1Mcat-1")
    })

    it("assigns places only when category scoring is complete", () => {
        const standings = calculate([
            { tournamentId: "t1", membershipNo: "M-001", rawScore: 290 },
            { tournamentId: "t2", membershipNo: "M-001", rawScore: 295 },
            { tournamentId: "t1", membershipNo: "M-002", rawScore: 280 },
            { tournamentId: "t2", membershipNo: "M-002", rawScore: 285 },
        ])

        expect(standings?.complete[0]?.competitors[0]?.place).toBe(1)
        expect(standings?.inProgress).toHaveLength(0)
    })

    it("sorts category groups by bow, age, then gender", () => {
        const mixedRegistrations = [
            {
                membershipNo: "M-001",
                competitorNumber: 1,
                name: "Alex",
                club: "Club A",
                ageGroupId: "A",
                ageGroupName: "Adult",
                categoryId: "FSR",
                categoryName: "Freestyle Recurve",
                genderGroup: "M",
            },
            {
                membershipNo: "M-002",
                competitorNumber: 2,
                name: "Blair",
                club: "Club B",
                ageGroupId: "C",
                ageGroupName: "Cub",
                categoryId: "BBC",
                categoryName: "Barebow Compound",
                genderGroup: "M",
            },
            {
                membershipNo: "M-003",
                competitorNumber: 3,
                name: "Casey",
                club: "Club C",
                ageGroupId: "C",
                ageGroupName: "Cub",
                categoryId: "BBC",
                categoryName: "Barebow Compound",
                genderGroup: "F",
            },
            {
                membershipNo: "M-004",
                competitorNumber: 4,
                name: "Dana",
                club: "Club D",
                ageGroupId: "J",
                ageGroupName: "Junior",
                categoryId: "BBC",
                categoryName: "Barebow Compound",
                genderGroup: "M",
            },
        ]

        const standings = calculateChampionshipCombinedStandings(
            mixedRegistrations,
            days,
            rounds,
            [],
            Object.fromEntries(mixedRegistrations.map((registration) => [registration.membershipNo, []]))
        )

        expect(standings?.inProgress.map((group) => group.categoryKey)).toEqual([
            championshipCategoryKey("C", "F", "BBC"),
            championshipCategoryKey("C", "M", "BBC"),
            championshipCategoryKey("J", "M", "BBC"),
            championshipCategoryKey("A", "M", "FSR"),
        ])
    })

    it("compareCombinedStandingsCategories uses bow, age, then gender", () => {
        expect(
            compareCombinedStandingsCategories(
                { categoryName: "Barebow Compound", ageGroupName: "Cub", genderGroup: "M" },
                { categoryName: "Freestyle Recurve", ageGroupName: "Adult", genderGroup: "M" }
            )
        ).toBeLessThan(0)
        expect(
            compareCombinedStandingsCategories(
                { categoryName: "Barebow Compound", ageGroupName: "Cub", genderGroup: "F" },
                { categoryName: "Barebow Compound", ageGroupName: "Cub", genderGroup: "M" }
            )
        ).toBeLessThan(0)
    })
})
