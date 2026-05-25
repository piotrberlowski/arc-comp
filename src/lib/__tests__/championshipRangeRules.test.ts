import {
    canEnrollDivisionOnDay,
    findDivisionRangeOnOtherDay,
    isDivisionRangeAssignmentComplete,
    isDivisionRangeBlockedOnOtherDay,
    mapDivisionRangeAssignments,
    resolveDivisionRangeForDay,
} from "@/lib/championshipRangeRules"

const assignments = [
    { dayOrder: 1, ageGroupId: "age-1", categoryId: "cat-1", genderGroup: "M", rangeNumber: 1 },
    { dayOrder: 2, ageGroupId: "age-2", categoryId: "cat-1", genderGroup: "M", rangeNumber: 2 },
]

describe("mapDivisionRangeAssignments", () => {
    it("maps prisma division range rows to assignment rows", () => {
        expect(
            mapDivisionRangeAssignments([
                {
                    dayOrder: 2,
                    ageGroupId: "age-1",
                    categoryId: "cat-1",
                    genderGroup: "M",
                    rangeNumber: 1,
                },
            ])
        ).toEqual([
            {
                dayOrder: 2,
                ageGroupId: "age-1",
                categoryId: "cat-1",
                genderGroup: "M",
                rangeNumber: 1,
            },
        ])
    })
})

describe("findDivisionRangeOnOtherDay", () => {
    it("returns the other day when the same division already uses that range", () => {
        expect(
            findDivisionRangeOnOtherDay(assignments, 2, "age-1", "cat-1", "M", 1)
        ).toBe(1)
    })

    it("returns null when the range is free on other days for that division", () => {
        expect(
            findDivisionRangeOnOtherDay(assignments, 2, "age-1", "cat-1", "M", 2)
        ).toBeNull()
    })

    it("returns null when another division uses the range on another day", () => {
        expect(
            findDivisionRangeOnOtherDay(assignments, 2, "age-2", "cat-1", "M", 1)
        ).toBeNull()
    })
})

describe("isDivisionRangeBlockedOnOtherDay", () => {
    it("blocks ranges already assigned on another day for the row", () => {
        expect(isDivisionRangeBlockedOnOtherDay({ 1: 1, 2: null }, 2, 1)).toBe(true)
        expect(isDivisionRangeBlockedOnOtherDay({ 1: 1, 2: null }, 2, 2)).toBe(false)
    })
})

describe("resolveDivisionRangeForDay", () => {
    it("returns the assigned range for multi-range championships", () => {
        expect(resolveDivisionRangeForDay(assignments, 2, 1, "age-1", "cat-1", "M")).toBe(1)
    })

    it("defaults to range 1 when only one range exists", () => {
        expect(resolveDivisionRangeForDay([], 1, 2, "age-1", "cat-1", "M")).toBe(1)
    })

    it("returns null when the division is not assigned", () => {
        expect(resolveDivisionRangeForDay(assignments, 2, 2, "age-1", "cat-1", "M")).toBeNull()
    })
})

describe("isDivisionRangeAssignmentComplete", () => {
    it("requires every roster division to have a range on each day", () => {
        expect(
            isDivisionRangeAssignmentComplete(
                [{ ageGroupId: "age-1", categoryId: "cat-1", genderGroup: "M" }],
                [1, 2],
                assignments,
                2
            )
        ).toBe(false)
    })

    it("is satisfied when each division is assigned on every day", () => {
        expect(
            isDivisionRangeAssignmentComplete(
                [{ ageGroupId: "age-1", categoryId: "cat-1", genderGroup: "M" }],
                [1],
                assignments,
                2
            )
        ).toBe(true)
    })
})

describe("canEnrollDivisionOnDay", () => {
    it("is false when the division has no assignment", () => {
        expect(canEnrollDivisionOnDay(assignments, 2, 2, "age-1", "cat-1", "M")).toBe(false)
    })
})
