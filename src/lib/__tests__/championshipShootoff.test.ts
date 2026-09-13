import {
    CHAMPIONSHIP_SHOOTOFF_STANDINGS_LABEL,
    championshipDayTitle,
    championshipHasShootoff,
    championshipShootoffTournamentName,
    championshipStandingsDayLabel,
    isShootoffDayOrder,
    nextChampionshipRangeNumber,
    regularChampionshipDayOrders,
    regularChampionshipRanges,
    shootoffEnrollmentRangeForDay,
    shootoffRangeNumber,
} from "@/lib/championshipShootoff"

const ranges = [{ rangeNumber: 1 }, { rangeNumber: 2 }]
const rangeCount = 1

const rounds = [
    { dayOrder: 1, rangeNumber: 1 },
    { dayOrder: 2, rangeNumber: 1 },
    { dayOrder: 3, rangeNumber: 2 },
]

describe("championshipShootoff", () => {
    it("treats ranges beyond rangeCount as the shootoff range", () => {
        expect(regularChampionshipRanges(ranges, rangeCount)).toEqual([{ rangeNumber: 1 }])
        expect(shootoffRangeNumber(ranges, rangeCount)).toBe(2)
        expect(championshipHasShootoff(ranges, rangeCount)).toBe(true)
        expect(nextChampionshipRangeNumber(ranges)).toBe(3)
    })

    it("finds no shootoff when every range is within rangeCount", () => {
        expect(shootoffRangeNumber([{ rangeNumber: 1 }], 1)).toBeNull()
        expect(nextChampionshipRangeNumber(undefined)).toBe(1)
        expect(championshipHasShootoff(undefined, 1)).toBe(false)
    })

    it("identifies the shootoff day and enrollment range", () => {
        expect(isShootoffDayOrder(3, rounds, 2)).toBe(true)
        expect(isShootoffDayOrder(2, rounds, 2)).toBe(false)
        expect(shootoffEnrollmentRangeForDay(3, rounds, 2)).toBe(2)
        expect(shootoffEnrollmentRangeForDay(1, rounds, 2)).toBeNull()
    })

    it("excludes the shootoff day from regular day orders", () => {
        expect(regularChampionshipDayOrders(rounds, 2)).toEqual([1, 2])
        expect(regularChampionshipDayOrders(rounds, null)).toEqual([1, 2, 3])
    })

    it("labels the shootoff day for hub and standings", () => {
        expect(championshipDayTitle(3, true)).toBe("Shootoff")
        expect(championshipDayTitle(2, false)).toBe("Day 2")
        expect(championshipStandingsDayLabel(3, true)).toBe(CHAMPIONSHIP_SHOOTOFF_STANDINGS_LABEL)
        expect(championshipShootoffTournamentName("Spring")).toBe("Spring — Shootoff")
    })
})
