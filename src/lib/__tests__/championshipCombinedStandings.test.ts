import {
    buildCombinedStandingsRows,
    compareCombinedStandingsRows,
    formatCombinedTotal,
    groupCombinedStandingsByCategory,
} from "@/lib/championshipCombinedStandings"
import { SCORE_DNC, toScore } from "@/lib/scoreUtils"

describe("championshipCombinedStandings", () => {
    const days = [
        { dayOrder: 1, tournamentId: "t1", label: "Day 1" },
        { dayOrder: 2, tournamentId: "t2", label: "Day 2" },
    ]

    const registrations = [
        {
            membershipNo: "M-001",
            competitorNumber: 1,
            name: "Alex",
            club: "Club A",
            ageGroupId: "age-1",
            categoryId: "cat-1",
            genderGroup: "M",
            ageGroupName: "Adult",
            categoryName: "Barebow",
        },
        {
            membershipNo: "M-002",
            competitorNumber: 2,
            name: "Blair",
            club: "Club B",
            ageGroupId: "age-1",
            categoryId: "cat-1",
            genderGroup: "M",
            ageGroupName: "Adult",
            categoryName: "Barebow",
        },
    ]

    const enrollmentByMembership = {
        "M-001": [1, 2],
        "M-002": [1, 2],
    }

    it("sums completed day scores across enrolled days", () => {
        const rows = buildCombinedStandingsRows(
            registrations,
            days,
            [
                { tournamentId: "t1", membershipNo: "M-001", rawScore: 290 },
                { tournamentId: "t2", membershipNo: "M-001", rawScore: 295 },
                { tournamentId: "t1", membershipNo: "M-002", rawScore: 280 },
                { tournamentId: "t2", membershipNo: "M-002", rawScore: 285 },
            ],
            enrollmentByMembership
        )

        const alex = rows.find((row) => row.membershipNo === "M-001")
        const blair = rows.find((row) => row.membershipNo === "M-002")

        expect(alex?.total).toBe(585)
        expect(blair?.total).toBe(565)
        expect(alex?.isComplete).toBe(true)
    })

    it("includes shootoff decimals in the total", () => {
        const rows = buildCombinedStandingsRows(
            [registrations[0]],
            days,
            [
                { tournamentId: "t1", membershipNo: "M-001", rawScore: toScore(290, 500) },
                { tournamentId: "t2", membershipNo: "M-001", rawScore: 295 },
            ],
            enrollmentByMembership
        )

        expect(rows[0]?.total).toBeCloseTo(290.5 + 295, 5)
    })

    it("does not add DNC to the combined total", () => {
        const rows = buildCombinedStandingsRows(
            [registrations[0]],
            days,
            [
                { tournamentId: "t1", membershipNo: "M-001", rawScore: SCORE_DNC },
                { tournamentId: "t2", membershipNo: "M-001", rawScore: 295 },
            ],
            enrollmentByMembership
        )

        expect(rows[0]?.total).toBe(295)
        expect(rows[0]?.isComplete).toBe(true)
    })

    it("marks not enrolled days and pending scores", () => {
        const rows = buildCombinedStandingsRows(
            [registrations[0]],
            days,
            [{ tournamentId: "t1", membershipNo: "M-001", rawScore: 290 }],
            { "M-001": [1] }
        )

        expect(rows[0]?.dayScores[1]).toEqual({
            kind: "scored",
            rawScore: 290,
            result: { status: "COMPLETED", score: 290, shootoff: null },
        })
        expect(rows[0]?.dayScores[2]).toEqual({ kind: "not_enrolled" })
        expect(rows[0]?.isComplete).toBe(true)
    })

    it("sorts complete rows by total then name", () => {
        const rows = buildCombinedStandingsRows(
            registrations,
            days,
            [
                { tournamentId: "t1", membershipNo: "M-001", rawScore: 290 },
                { tournamentId: "t2", membershipNo: "M-001", rawScore: 295 },
                { tournamentId: "t1", membershipNo: "M-002", rawScore: 280 },
                { tournamentId: "t2", membershipNo: "M-002", rawScore: 285 },
            ],
            enrollmentByMembership
        )

        const sorted = [...rows].sort(compareCombinedStandingsRows)
        expect(sorted.map((row) => row.membershipNo)).toEqual(["M-001", "M-002"])
    })

    it("groups rows by category", () => {
        const categories = groupCombinedStandingsByCategory(
            buildCombinedStandingsRows(registrations, days, [], enrollmentByMembership)
        )

        expect(categories).toHaveLength(1)
        expect(categories[0]?.rows).toHaveLength(2)
    })

    it("formats totals without trailing zeros", () => {
        expect(formatCombinedTotal(585)).toBe("585")
        expect(formatCombinedTotal(585.5)).toBe("585.5")
    })
})
