import {
    buildCompetitorStandingsByCategory,
    type RegisteredCompetitor,
} from "@/lib/championshipCombinedStandings"
import { SCORE_DNC } from "@/lib/scoreUtils"
import {
    assertAutoSeedPlanIsComplete,
    buildTournamentAutoSeedPlan,
    formatAutoSeedFailureMessage,
    formatAutoSeedValidationMessage,
    type AutoSeedParticipant,
} from "@/lib/championshipAutoSeed"

function autoSeedContext(
    registrations: RegisteredCompetitor[],
    days: { dayOrder: number; tournamentId: string; label: string }[],
    rounds: { dayOrder: number; rangeNumber: number; tournamentId: string }[],
    scores: { tournamentId: string; membershipNo: string; rawScore: number }[],
    enrollment: Record<string, { dayOrder: number; rangeNumber: number }[]>
) {
    const competitorStandingsByCategory = buildCompetitorStandingsByCategory(
        registrations,
        days,
        rounds,
        scores,
        enrollment
    )

    return {
        priorDayOrders: days.map((day) => day.dayOrder),
        competitorStandingsByCategory,
    }
}

describe("buildTournamentAutoSeedPlan", () => {
    const registrations = [
        {
            membershipNo: "M-1",
            competitorNumber: 1,
            name: "First",
            club: "A",
            ageGroupId: "age",
            ageGroupName: "Adult",
            categoryId: "cat",
            categoryName: "Recurve",
            genderGroup: "M",
        },
        {
            membershipNo: "M-2",
            competitorNumber: 2,
            name: "Second",
            club: "A",
            ageGroupId: "age",
            ageGroupName: "Adult",
            categoryId: "cat",
            categoryName: "Recurve",
            genderGroup: "M",
        },
        {
            membershipNo: "M-3",
            competitorNumber: 3,
            name: "Third",
            club: "A",
            ageGroupId: "age",
            ageGroupName: "Adult",
            categoryId: "cat",
            categoryName: "Recurve",
            genderGroup: "M",
        },
        {
            membershipNo: "M-4",
            competitorNumber: 4,
            name: "Fourth",
            club: "A",
            ageGroupId: "age",
            ageGroupName: "Adult",
            categoryId: "cat",
            categoryName: "Recurve",
            genderGroup: "M",
        },
        {
            membershipNo: "M-5",
            competitorNumber: 5,
            name: "Fifth",
            club: "A",
            ageGroupId: "age",
            ageGroupName: "Adult",
            categoryId: "cat",
            categoryName: "Recurve",
            genderGroup: "M",
        },
        {
            membershipNo: "M-6",
            competitorNumber: 6,
            name: "Sixth",
            club: "A",
            ageGroupId: "age",
            ageGroupName: "Adult",
            categoryId: "cat",
            categoryName: "Recurve",
            genderGroup: "M",
        },
        {
            membershipNo: "M-7",
            competitorNumber: 7,
            name: "Seventh",
            club: "A",
            ageGroupId: "age",
            ageGroupName: "Adult",
            categoryId: "cat",
            categoryName: "Recurve",
            genderGroup: "M",
        },
    ]

    const days = [{ dayOrder: 1, tournamentId: "t1", label: "Day 1" }]
    const rounds = [{ dayOrder: 1, rangeNumber: 1, tournamentId: "t1" }]
    const enrollment = Object.fromEntries(
        registrations.map((registration) => [
            registration.membershipNo,
            [{ dayOrder: 1, rangeNumber: 1 }],
        ])
    )

    const seedContext = autoSeedContext(
        registrations,
        days,
        rounds,
        registrations.map((registration, index) => ({
            tournamentId: "t1",
            membershipNo: registration.membershipNo,
            rawScore: 300 - index,
        })),
        enrollment
    )

    const participants: AutoSeedParticipant[] = registrations.map((registration, index) => ({
        id: `p-${index + 1}`,
        membershipNo: registration.membershipNo,
        competitorNumber: registration.competitorNumber,
        ageGroupId: registration.ageGroupId,
        categoryId: registration.categoryId,
        genderGroup: registration.genderGroup,
    }))

    it("keeps seeds 1-4 together and balances across selected targets", () => {
        const plan = buildTournamentAutoSeedPlan({
            tournamentId: "t2",
            rangeNumber: 1,
            groupSize: 4,
            endCount: 28,
            targetRange: { firstTarget: 1, targetCount: 2 },
            participants,
            ...seedContext,
        })

        expect(plan.warnings).toEqual([])
        expect(plan.assignments).toHaveLength(7)

        const groupOne = plan.assignments
            .filter((assignment) => assignment.groupNumber === 1)
            .map((assignment) => assignment.participantId)
        const groupTwo = plan.assignments
            .filter((assignment) => assignment.groupNumber === 2)
            .map((assignment) => assignment.participantId)

        expect(groupOne).toEqual(["p-1", "p-2", "p-3", "p-4"])
        expect(groupTwo).toEqual(["p-5", "p-6", "p-7"])
    })

    it("seeds only day-2 participants when fewer archers return", () => {
        const dayTwoParticipants = participants.slice(0, 3)

        const plan = buildTournamentAutoSeedPlan({
            tournamentId: "t2",
            rangeNumber: 1,
            groupSize: 4,
            endCount: 28,
            targetRange: { firstTarget: 1, targetCount: 1 },
            participants: dayTwoParticipants,
            ...seedContext,
        })

        expect(plan.warnings).toEqual([])
        expect(plan.assignments).toHaveLength(3)
        expect(plan.assignments.map((assignment) => assignment.participantId)).toEqual([
            "p-1",
            "p-2",
            "p-3",
        ])
        assertAutoSeedPlanIsComplete(plan, ["p-1", "p-2", "p-3"])
    })

    it("places DNC archers last in the standing block", () => {
        const dncContext = autoSeedContext(
            registrations.slice(0, 4),
            days,
            rounds,
            [
                { tournamentId: "t1", membershipNo: "M-1", rawScore: 300 },
                { tournamentId: "t1", membershipNo: "M-2", rawScore: 299 },
                { tournamentId: "t1", membershipNo: "M-3", rawScore: 298 },
                { tournamentId: "t1", membershipNo: "M-4", rawScore: SCORE_DNC },
            ],
            {
                "M-1": [{ dayOrder: 1, rangeNumber: 1 }],
                "M-2": [{ dayOrder: 1, rangeNumber: 1 }],
                "M-3": [{ dayOrder: 1, rangeNumber: 1 }],
                "M-4": [{ dayOrder: 1, rangeNumber: 1 }],
            }
        )

        const plan = buildTournamentAutoSeedPlan({
            tournamentId: "t2",
            rangeNumber: 1,
            groupSize: 4,
            endCount: 28,
            targetRange: { firstTarget: 1, targetCount: 1 },
            participants: participants.slice(0, 4),
            ...dncContext,
        })

        expect(plan.warnings).toEqual([])
        expect(plan.assignments.map((assignment) => assignment.participantId)).toEqual([
            "p-1",
            "p-2",
            "p-3",
            "p-4",
        ])
        expect(plan.assignments.find((assignment) => assignment.participantId === "p-4")?.positionInGroup).toBe(
            4
        )
    })

    it("places day-2-only enrollments after prior-day scorers", () => {
        const dayTwoOnlyRegistration = {
            membershipNo: "M-8",
            competitorNumber: 8,
            name: "Late",
            club: "A",
            ageGroupId: "age",
            ageGroupName: "Adult",
            categoryId: "cat",
            categoryName: "Recurve",
            genderGroup: "M",
        }

        const mixedRegistrations = [...registrations.slice(0, 4), dayTwoOnlyRegistration]
        const mixedEnrollment = {
            "M-1": [{ dayOrder: 1, rangeNumber: 1 }],
            "M-2": [{ dayOrder: 1, rangeNumber: 1 }],
            "M-3": [{ dayOrder: 1, rangeNumber: 1 }],
            "M-4": [{ dayOrder: 1, rangeNumber: 1 }],
            "M-8": [{ dayOrder: 2, rangeNumber: 1 }],
        }

        const mixedContext = autoSeedContext(
            mixedRegistrations,
            days,
            rounds,
            [
                { tournamentId: "t1", membershipNo: "M-1", rawScore: 300 },
                { tournamentId: "t1", membershipNo: "M-2", rawScore: 299 },
                { tournamentId: "t1", membershipNo: "M-3", rawScore: 298 },
                { tournamentId: "t1", membershipNo: "M-4", rawScore: 297 },
            ],
            mixedEnrollment
        )

        const dayTwoParticipants: AutoSeedParticipant[] = [
            {
                id: "p-1",
                membershipNo: "M-1",
                competitorNumber: 1,
                ageGroupId: "age",
                categoryId: "cat",
                genderGroup: "M",
            },
            {
                id: "p-8",
                membershipNo: "M-8",
                competitorNumber: 8,
                ageGroupId: "age",
                categoryId: "cat",
                genderGroup: "M",
            },
        ]

        const plan = buildTournamentAutoSeedPlan({
            tournamentId: "t2",
            rangeNumber: 1,
            groupSize: 4,
            endCount: 28,
            targetRange: { firstTarget: 1, targetCount: 1 },
            participants: dayTwoParticipants,
            ...mixedContext,
        })

        expect(plan.assignments.map((assignment) => assignment.participantId)).toEqual(["p-1", "p-8"])
    })

    it("seeds divisions with in-progress prior-day standings", () => {
        const inProgressContext = autoSeedContext(
            registrations.slice(0, 4),
            days,
            rounds,
            [
                { tournamentId: "t1", membershipNo: "M-1", rawScore: 300 },
                { tournamentId: "t1", membershipNo: "M-2", rawScore: 299 },
                { tournamentId: "t1", membershipNo: "M-3", rawScore: 298 },
            ],
            {
                "M-1": [{ dayOrder: 1, rangeNumber: 1 }],
                "M-2": [{ dayOrder: 1, rangeNumber: 1 }],
                "M-3": [{ dayOrder: 1, rangeNumber: 1 }],
                "M-4": [{ dayOrder: 1, rangeNumber: 1 }],
            }
        )

        const plan = buildTournamentAutoSeedPlan({
            tournamentId: "t2",
            rangeNumber: 1,
            groupSize: 4,
            endCount: 28,
            targetRange: { firstTarget: 1, targetCount: 1 },
            participants: participants.slice(0, 4),
            ...inProgressContext,
        })

        expect(plan.warnings).toEqual([])
        expect(plan.assignments.map((assignment) => assignment.participantId)).toEqual([
            "p-1",
            "p-2",
            "p-3",
            "p-4",
        ])
    })

    it("combines small divisions on shared targets", () => {
        const smallA: AutoSeedParticipant[] = [
            {
                id: "a-1",
                membershipNo: "A-1",
                competitorNumber: 11,
                ageGroupId: "age",
                categoryId: "cat-a",
                genderGroup: "M",
            },
            {
                id: "a-2",
                membershipNo: "A-2",
                competitorNumber: 12,
                ageGroupId: "age",
                categoryId: "cat-a",
                genderGroup: "M",
            },
        ]
        const smallB: AutoSeedParticipant[] = [
            {
                id: "b-1",
                membershipNo: "B-1",
                competitorNumber: 21,
                ageGroupId: "age",
                categoryId: "cat-b",
                genderGroup: "F",
            },
            {
                id: "b-2",
                membershipNo: "B-2",
                competitorNumber: 22,
                ageGroupId: "age",
                categoryId: "cat-b",
                genderGroup: "F",
            },
        ]

        const smallContext = autoSeedContext(
            [
                {
                    membershipNo: "A-1",
                    competitorNumber: 11,
                    name: "A1",
                    club: "A",
                    ageGroupId: "age",
                    ageGroupName: "Adult",
                    categoryId: "cat-a",
                    categoryName: "Recurve",
                    genderGroup: "M",
                },
                {
                    membershipNo: "A-2",
                    competitorNumber: 12,
                    name: "A2",
                    club: "A",
                    ageGroupId: "age",
                    ageGroupName: "Adult",
                    categoryId: "cat-a",
                    categoryName: "Recurve",
                    genderGroup: "M",
                },
                {
                    membershipNo: "B-1",
                    competitorNumber: 21,
                    name: "B1",
                    club: "B",
                    ageGroupId: "age",
                    ageGroupName: "Adult",
                    categoryId: "cat-b",
                    categoryName: "Barebow",
                    genderGroup: "F",
                },
                {
                    membershipNo: "B-2",
                    competitorNumber: 22,
                    name: "B2",
                    club: "B",
                    ageGroupId: "age",
                    ageGroupName: "Adult",
                    categoryId: "cat-b",
                    categoryName: "Barebow",
                    genderGroup: "F",
                },
            ],
            days,
            rounds,
            [
                { tournamentId: "t1", membershipNo: "A-1", rawScore: 290 },
                { tournamentId: "t1", membershipNo: "A-2", rawScore: 280 },
                { tournamentId: "t1", membershipNo: "B-1", rawScore: 270 },
                { tournamentId: "t1", membershipNo: "B-2", rawScore: 260 },
            ],
            {
                "A-1": [{ dayOrder: 1, rangeNumber: 1 }],
                "A-2": [{ dayOrder: 1, rangeNumber: 1 }],
                "B-1": [{ dayOrder: 1, rangeNumber: 1 }],
                "B-2": [{ dayOrder: 1, rangeNumber: 1 }],
            }
        )

        const plan = buildTournamentAutoSeedPlan({
            tournamentId: "t2",
            rangeNumber: 1,
            groupSize: 4,
            endCount: 28,
            targetRange: { firstTarget: 3, targetCount: 1 },
            participants: [...smallA, ...smallB],
            ...smallContext,
        })

        expect(plan.warnings).toEqual([])
        expect(plan.assignments.every((assignment) => assignment.groupNumber === 3)).toBe(true)
        expect(plan.assignments.map((assignment) => assignment.participantId)).toEqual([
            "a-1",
            "a-2",
            "b-1",
            "b-2",
        ])
    })

    it("assertAutoSeedPlanIsComplete rejects warnings or missing archers", () => {
        expect(() =>
            assertAutoSeedPlanIsComplete(
                {
                    tournamentId: "t1",
                    rangeNumber: 1,
                    assignments: [],
                    warnings: ["Could not place block"],
                },
                ["p-1"]
            )
        ).toThrow("Could not place block")

        expect(() =>
            assertAutoSeedPlanIsComplete(
                {
                    tournamentId: "t1",
                    rangeNumber: 1,
                    assignments: [{ participantId: "p-1", groupNumber: 1, positionInGroup: 1, isCaptain: true }],
                    warnings: [],
                },
                ["p-1", "p-2"]
            )
        ).toThrow("did not assign 1 archer")
    })

    it("formats failure messages for the UI", () => {
        expect(formatAutoSeedValidationMessage("Targets must be within 1–28")).toContain(
            "Check the target range"
        )
        expect(formatAutoSeedFailureMessage(new Error("Could not place block"))).toContain(
            "Existing group assignments on this range are unchanged"
        )
        expect(formatAutoSeedFailureMessage(new Error("Could not place block"))).toContain(
            "Could not place block"
        )
    })
})
