import {
    buildPublicChampionshipPrintPath,
    buildPublicChampionshipResultsPath,
    buildPublicChampionshipResultsUrl,
    parsePublicChampionshipDayQuery,
} from "../publicChampionshipUrls"

describe("publicChampionshipUrls", () => {
    it("builds results paths with optional day query", () => {
        expect(buildPublicChampionshipResultsPath("champ-1")).toBe("/results/championships/champ-1")
        expect(buildPublicChampionshipResultsPath("champ-1", 2)).toBe("/results/championships/champ-1?day=2")
    })

    it("builds absolute results urls", () => {
        expect(buildPublicChampionshipResultsUrl("https://example.com", "champ-1", 3)).toBe(
            "https://example.com/results/championships/champ-1?day=3"
        )
    })

    it("builds print path", () => {
        expect(buildPublicChampionshipPrintPath("champ-1", 2)).toBe("/results/championships/champ-1/print/2")
    })

    it("parses day query values", () => {
        expect(parsePublicChampionshipDayQuery(undefined)).toBeUndefined()
        expect(parsePublicChampionshipDayQuery("2")).toBe(2)
        expect(parsePublicChampionshipDayQuery("0")).toBeUndefined()
        expect(parsePublicChampionshipDayQuery("x")).toBeUndefined()
    })
})
