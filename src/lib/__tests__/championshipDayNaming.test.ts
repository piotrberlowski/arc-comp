import {
    championshipDayRangeLabel,
    championshipDayTournamentName,
    championshipRangeDisplayName,
    championshipRangeLabels,
    championshipRangeSectionHeading,
    nextChampionshipDayDefaultDate,
    nextChampionshipDayOrder,
    normalizeChampionshipRangeName,
} from "@/lib/championshipDayNaming"

describe("normalizeChampionshipRangeName", () => {
    it("stores blank and whitespace as null", () => {
        expect(normalizeChampionshipRangeName(null)).toBeNull()
        expect(normalizeChampionshipRangeName("")).toBeNull()
        expect(normalizeChampionshipRangeName("   ")).toBeNull()
        expect(normalizeChampionshipRangeName(" Forest ")).toBe("Forest")
    })
})

describe("championshipRangeDisplayName", () => {
    it("falls back to Range N when name is null or blank", () => {
        expect(championshipRangeDisplayName(1, null)).toBe("Range 1")
        expect(championshipRangeDisplayName(2, "  ")).toBe("Range 2")
    })

    it("uses the trimmed custom name", () => {
        expect(championshipRangeDisplayName(1, " Forest ")).toBe("Forest")
    })
})

describe("championshipRangeLabels", () => {
    it("builds labels for each range with generated fallback", () => {
        expect(championshipRangeLabels(2, [{ rangeNumber: 2, name: "Field" }])).toEqual({
            1: "Range 1",
            2: "Field",
        })
    })
})

describe("championshipDayRangeLabel", () => {
    it("hides the range label for single-range championships", () => {
        expect(championshipDayRangeLabel(1, 1, "Forest")).toBeNull()
    })

    it("returns the display name for multi-range championships", () => {
        expect(championshipDayRangeLabel(2, 1, null)).toBe("Range 1")
        expect(championshipDayRangeLabel(2, 2, "Field")).toBe("Field")
    })
})

describe("championshipRangeSectionHeading", () => {
    it("prefixes the range display name", () => {
        expect(championshipRangeSectionHeading(1, "Spring — Day 1", "Forest")).toBe(
            "Forest — Spring — Day 1"
        )
        expect(championshipRangeSectionHeading(2, "Spring — Day 1 Range 2")).toBe(
            "Range 2 — Spring — Day 1 Range 2"
        )
    })
})

describe("championshipDayTournamentName", () => {
    it("omits range when championship has one range", () => {
        expect(championshipDayTournamentName("Spring", 1, 1, 1, "Forest")).toBe("Spring — Day 1")
    })

    it("includes every range when championship has multiple ranges", () => {
        expect(championshipDayTournamentName("Spring", 1, 1, 2)).toBe("Spring — Day 1 Range 1")
        expect(championshipDayTournamentName("Spring", 2, 2, 2)).toBe("Spring — Day 2 Range 2")
    })

    it("uses custom range names in multi-range day labels", () => {
        expect(championshipDayTournamentName("Spring", 1, 1, 2, "Forest")).toBe("Spring — Day 1 Forest")
        expect(championshipDayTournamentName("Spring", 1, 2, 2, "  ")).toBe("Spring — Day 1 Range 2")
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
