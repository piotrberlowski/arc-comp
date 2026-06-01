import { sumCompletedScoresForRange } from "@/lib/championshipCombinedIfafScores"

describe("championshipCombinedIfafScores", () => {
    const rounds = [
        { dayOrder: 1, rangeNumber: 1, tournamentId: "t1" },
        { dayOrder: 2, rangeNumber: 2, tournamentId: "t2" },
    ]

    it("sums completed scores on a range across days", () => {
        const total = sumCompletedScoresForRange(
            [
                { dayOrder: 1, rangeNumber: 1 },
                { dayOrder: 2, rangeNumber: 2 },
            ],
            rounds,
            1,
            new Map([["t1", 280]])
        )

        expect(total).toBe(280)
    })

    it("sums multiple day scores on the same range", () => {
        const total = sumCompletedScoresForRange(
            [
                { dayOrder: 1, rangeNumber: 1 },
                { dayOrder: 2, rangeNumber: 1 },
            ],
            [
                { dayOrder: 1, rangeNumber: 1, tournamentId: "t1" },
                { dayOrder: 2, rangeNumber: 1, tournamentId: "t2" },
            ],
            1,
            new Map([
                ["t1", 100],
                ["t2", 120],
            ])
        )

        expect(total).toBe(220)
    })
})
