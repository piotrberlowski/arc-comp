import {
    buildCategoryRangeUpdates,
    canEnrollDivisionOnDay,
    collectSoleAvailableRangeAssignments,
    matrixRowsForAutoFillAfterAssign,
    findDivisionRangeOnOtherDay,
    isDivisionRangeAssignmentComplete,
    isDivisionRangeBlockedOnOtherDay,
    mapDivisionRangeAssignments,
    resolveDivisionRangeForDay,
    shouldApplyRangeOnDay,
    soleAvailableRangeForDay,
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

describe("soleAvailableRangeForDay", () => {
    it("returns the only range left when other days block the rest", () => {
        expect(soleAvailableRangeForDay({ 1: 1, 2: null }, 2, 2)).toBe(2)
    })

    it("returns null when multiple ranges are still available", () => {
        expect(soleAvailableRangeForDay({ 1: null, 2: null }, 1, 2)).toBeNull()
    })

    it("returns null when the day is already assigned", () => {
        expect(soleAvailableRangeForDay({ 1: 1, 2: null }, 1, 2)).toBeNull()
    })
})

describe("collectSoleAvailableRangeAssignments", () => {
    it("collects unassigned cells with exactly one valid range", () => {
        expect(
            collectSoleAvailableRangeAssignments(
                [{ divisionKey: "age-1:M:cat-1", rangeByDay: { 1: 1, 2: null } }],
                [1, 2],
                2,
                false
            )
        ).toEqual([{ divisionKey: "age-1:M:cat-1", dayOrder: 2, rangeNumber: 2 }])
    })
})

describe("matrixRowsForAutoFillAfterAssign", () => {
    const rows = [
        { divisionKey: "age-1:M:cat-1", categoryId: "cat-1" },
        { divisionKey: "age-2:M:cat-1", categoryId: "cat-1" },
        { divisionKey: "age-1:M:cat-2", categoryId: "cat-2" },
    ]

    it("scopes to one division for a single-cell assign", () => {
        expect(
            matrixRowsForAutoFillAfterAssign(rows, [
                { divisionKey: "age-1:M:cat-1", dayOrder: 1, rangeNumber: 1 },
            ])
        ).toEqual([rows[0]])
    })

    it("scopes to the bow category for bulk assigns in one category", () => {
        expect(
            matrixRowsForAutoFillAfterAssign(rows, [
                { divisionKey: "age-1:M:cat-1", dayOrder: 1, rangeNumber: 1 },
                { divisionKey: "age-2:M:cat-1", dayOrder: 1, rangeNumber: 2 },
            ])
        ).toEqual([rows[0], rows[1]])
    })

    it("returns no rows for clears or cross-category updates", () => {
        expect(
            matrixRowsForAutoFillAfterAssign(rows, [
                { divisionKey: "age-1:M:cat-1", dayOrder: 1, rangeNumber: null },
            ])
        ).toEqual([])
        expect(
            matrixRowsForAutoFillAfterAssign(rows, [
                { divisionKey: "age-1:M:cat-1", dayOrder: 1, rangeNumber: 1 },
                { divisionKey: "age-1:M:cat-2", dayOrder: 1, rangeNumber: 1 },
            ])
        ).toEqual([])
    })
})

describe("buildCategoryRangeUpdates", () => {
    const rows = [
        { divisionKey: "age-1:M:cat-1", rangeByDay: { 1: 1, 2: 2 } },
        { divisionKey: "age-2:M:cat-1", rangeByDay: { 1: 1, 2: null } },
    ]

    it("clears every assigned day in the category", () => {
        expect(buildCategoryRangeUpdates(rows, [1, 2], "all", null, false)).toEqual([
            { divisionKey: "age-1:M:cat-1", dayOrder: 1, rangeNumber: null },
            { divisionKey: "age-1:M:cat-1", dayOrder: 2, rangeNumber: null },
            { divisionKey: "age-2:M:cat-1", dayOrder: 1, rangeNumber: null },
        ])
    })

    it("skips frozen day 1 when clearing the whole category", () => {
        expect(buildCategoryRangeUpdates(rows, [1, 2], "all", null, true)).toEqual([
            { divisionKey: "age-1:M:cat-1", dayOrder: 2, rangeNumber: null },
        ])
    })
})

describe("shouldApplyRangeOnDay", () => {
    it("allows clearing an assigned day", () => {
        expect(shouldApplyRangeOnDay({ 1: 1, 2: 2 }, 2, null, false)).toBe(true)
    })

    it("skips clear when the day is already empty", () => {
        expect(shouldApplyRangeOnDay({ 1: 1, 2: null }, 2, null, false)).toBe(false)
    })

    it("allows assigning a free range on an editable day", () => {
        expect(shouldApplyRangeOnDay({ 1: 1, 2: null }, 2, 2, false)).toBe(true)
    })

    it("rejects blocked ranges and frozen day 1", () => {
        expect(shouldApplyRangeOnDay({ 1: 1, 2: null }, 2, 1, false)).toBe(false)
        expect(shouldApplyRangeOnDay({ 1: null, 2: null }, 1, 1, true)).toBe(false)
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
