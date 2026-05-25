import {
    championshipDayTournamentName,
    nextChampionshipDayDefaultDate,
    nextChampionshipDayOrder,
} from "@/lib/championshipDayNaming"

describe("championshipDayTournamentName", () => {
    it("omits range when championship has one range", () => {
        expect(championshipDayTournamentName("Spring", 1, 1, 1)).toBe("Spring — Day 1")
    })

    it("includes every range when championship has multiple ranges", () => {
        expect(championshipDayTournamentName("Spring", 1, 1, 2)).toBe("Spring — Day 1 Range 1")
        expect(championshipDayTournamentName("Spring", 2, 2, 2)).toBe("Spring — Day 2 Range 2")
    })
})

describe("nextChampionshipDayOrder", () => {
    it("starts at 1 when there are no rounds", () => {
        expect(nextChampionshipDayOrder([])).toBe(1)
    })

    it("increments after the highest day order", () => {
        expect(nextChampionshipDayOrder([{ dayOrder: 1 }, { dayOrder: 1 }, { dayOrder: 2 }])).toBe(3)
    })
})

describe("nextChampionshipDayDefaultDate", () => {
    it("uses today when there are no rounds", () => {
        const today = new Date()
        const result = nextChampionshipDayDefaultDate([])
        expect(result.getFullYear()).toBe(today.getFullYear())
        expect(result.getMonth()).toBe(today.getMonth())
        expect(result.getDate()).toBe(today.getDate())
    })

    it("uses the latest day date plus one calendar day", () => {
        const result = nextChampionshipDayDefaultDate([
            { dayOrder: 1, date: new Date(2026, 4, 10) },
            { dayOrder: 2, date: new Date(2026, 4, 12) },
            { dayOrder: 2, date: new Date(2026, 4, 12) },
        ])
        expect(result.getFullYear()).toBe(2026)
        expect(result.getMonth()).toBe(4)
        expect(result.getDate()).toBe(13)
    })
})
