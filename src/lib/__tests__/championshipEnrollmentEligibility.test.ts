import {
    areChampionshipRangeAssignmentsComplete,
    buildChampionshipEnrollmentEligibility,
    filterMembershipNosEligibleOnDay,
    listChampionshipRosterDays,
} from "@/lib/championshipEnrollment"

const assignments = [
    { dayOrder: 1, ageGroupId: "age-1", categoryId: "cat-1", genderGroup: "M", rangeNumber: 1 },
]

describe("listChampionshipRosterDays", () => {
    it("returns one column per day regardless of range count", () => {
        expect(
            listChampionshipRosterDays([
                { dayOrder: 1, label: "Day 1" },
                { dayOrder: 1, label: "Day 1 Range 2" },
                { dayOrder: 2, label: "Day 2" },
            ])
        ).toEqual([
            { dayOrder: 1, label: "Day 1" },
            { dayOrder: 2, label: "Day 2" },
        ])
    })
})

describe("filterMembershipNosEligibleOnDay", () => {
    const membershipByNo = new Map([
        [
            "M-001",
            {
                membershipNo: "M-001",
                ageGroupId: "age-1",
                categoryId: "cat-1",
                genderGroup: "M",
            },
        ],
        [
            "M-002",
            {
                membershipNo: "M-002",
                ageGroupId: "age-2",
                categoryId: "cat-1",
                genderGroup: "M",
            },
        ],
    ])

    it("keeps only competitors whose division is assigned on the day", () => {
        expect(
            filterMembershipNosEligibleOnDay(assignments, 2, 1, ["M-001", "M-002"], membershipByNo)
        ).toEqual(["M-001"])
    })
})

describe("areChampionshipRangeAssignmentsComplete", () => {
    it("is false until every roster division is assigned on each day", () => {
        expect(
            areChampionshipRangeAssignmentsComplete(
                [
                    { ageGroupId: "age-1", categoryId: "cat-1", genderGroup: "M" },
                    { ageGroupId: "age-2", categoryId: "cat-1", genderGroup: "M" },
                ],
                [1, 2],
                assignments,
                2
            )
        ).toBe(false)
    })
})

describe("buildChampionshipEnrollmentEligibility", () => {
    it("allows every division on the shootoff day", () => {
        expect(
            buildChampionshipEnrollmentEligibility(
                [{ ageGroupId: "age-1", categoryId: "cat-1", genderGroup: "M" }],
                [1, 2],
                assignments,
                2,
                [
                    { dayOrder: 1, rangeNumber: 1 },
                    { dayOrder: 2, rangeNumber: 3 },
                ],
                3
            )
        ).toEqual({
            "age-1:M:cat-1": { 1: true, 2: true },
        })
    })
})
