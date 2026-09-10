import { buildDivisionRangeMatrixFromShell } from "@/lib/championshipDivisionRangeMatrix"

describe("buildDivisionRangeMatrixFromShell", () => {
    it("builds matrix rows and totals from shell data", () => {
        const matrix = buildDivisionRangeMatrixFromShell({
            rangeCount: 2,
            rounds: [
                {
                    dayOrder: 1,
                    rangeNumber: 1,
                    tournament: { _count: { participantScores: 0 } },
                },
                {
                    dayOrder: 1,
                    rangeNumber: 2,
                    tournament: { _count: { participantScores: 0 } },
                },
            ],
            registrations: [
                {
                    ageGroupId: "J",
                    categoryId: "R",
                    genderGroup: "M",
                    ageGroup: { name: "Junior" },
                    category: { name: "Recurve" },
                },
            ],
            divisionRanges: [
                {
                    dayOrder: 1,
                    ageGroupId: "J",
                    categoryId: "R",
                    genderGroup: "M",
                    rangeNumber: 2,
                },
            ],
        })

        expect(matrix).not.toBeNull()
        expect(matrix?.rows).toHaveLength(1)
        expect(matrix?.rows[0]?.rangeByDay[1]).toBe(2)
        expect(matrix?.totalsByDay[1][2]).toBe(1)
        expect(matrix?.rangeLabels).toEqual({ 1: "Range 1", 2: "Range 2" })
    })

    it("uses custom range names in matrix labels", () => {
        const matrix = buildDivisionRangeMatrixFromShell({
            rangeCount: 2,
            rangeConfigs: [{ rangeNumber: 1, name: "Forest" }],
            rounds: [
                {
                    dayOrder: 1,
                    rangeNumber: 1,
                    tournament: { _count: { participantScores: 0 } },
                },
                {
                    dayOrder: 1,
                    rangeNumber: 2,
                    tournament: { _count: { participantScores: 0 } },
                },
            ],
            registrations: [
                {
                    ageGroupId: "J",
                    categoryId: "R",
                    genderGroup: "M",
                    ageGroup: { name: "Junior" },
                    category: { name: "Recurve" },
                },
            ],
            divisionRanges: [],
        })

        expect(matrix?.rangeLabels).toEqual({ 1: "Forest", 2: "Range 2" })
    })

    it("returns null for single-range championships", () => {
        expect(
            buildDivisionRangeMatrixFromShell({
                rangeCount: 1,
                rounds: [],
                registrations: [],
                divisionRanges: [],
            })
        ).toBeNull()
    })
})
