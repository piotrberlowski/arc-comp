import { computeDivisionRangeTotalsByDay } from "@/lib/divisionRangeMatrixTotals"

describe("computeDivisionRangeTotalsByDay", () => {
    it("sums registration counts per day and range", () => {
        expect(
            computeDivisionRangeTotalsByDay(
                [1, 2],
                2,
                [
                    {
                        divisionKey: "a",
                        ageGroupId: "a",
                        categoryId: "c",
                        categoryName: "C",
                        ageGroupName: "A",
                        genderGroup: "M",
                        abbrev: "AM",
                        registrationCount: 3,
                        rangeByDay: { 1: 1, 2: 2 },
                        isCub: false,
                    },
                ]
            )
        ).toEqual({
            1: { 1: 3, 2: 0 },
            2: { 1: 0, 2: 3 },
        })
    })
})
