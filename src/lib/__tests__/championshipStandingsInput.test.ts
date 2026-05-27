import {
    buildChampionshipCombinedStandingsFromChampionshipData,
    buildChampionshipStandingsDays,
    mapChampionshipRegistrationsToStandings,
} from "../championshipStandingsInput"

describe("mapChampionshipRegistrationsToStandings", () => {
    it("maps registration profile fields for standings calculation", () => {
        expect(
            mapChampionshipRegistrationsToStandings([
                {
                    membershipNo: "M-001",
                    competitorNumber: 1,
                    name: "Alex",
                    club: "Club A",
                    ageGroupId: "A",
                    genderGroup: "M",
                    categoryId: "BBC",
                    ageGroup: { name: "Adult" },
                    category: { name: "Barebow Compound" },
                },
            ])
        ).toEqual([
            {
                membershipNo: "M-001",
                competitorNumber: 1,
                name: "Alex",
                club: "Club A",
                ageGroupId: "A",
                ageGroupName: "Adult",
                categoryId: "BBC",
                categoryName: "Barebow Compound",
                genderGroup: "M",
            },
        ])
    })
})

describe("buildChampionshipStandingsDays", () => {
    it("builds ordered day labels from round tournaments", () => {
        expect(
            buildChampionshipStandingsDays([
                { dayOrder: 2, rangeNumber: 1, tournamentId: "t2" },
                { dayOrder: 1, rangeNumber: 1, tournamentId: "t1" },
                { dayOrder: 1, rangeNumber: 2, tournamentId: "t1b" },
            ])
        ).toEqual([
            { dayOrder: 1, tournamentId: "t1", label: "Day 1" },
            { dayOrder: 2, tournamentId: "t2", label: "Day 2" },
        ])
    })
})

describe("buildChampionshipCombinedStandingsFromChampionshipData", () => {
    it("returns null when there are no championship days", () => {
        expect(
            buildChampionshipCombinedStandingsFromChampionshipData({
                registrations: [],
                rounds: [],
                scores: [],
                enrollmentByTournament: {},
            })
        ).toBeNull()
    })

    it("calculates standings from shared championship inputs", () => {
        const standings = buildChampionshipCombinedStandingsFromChampionshipData({
            registrations: [
                {
                    membershipNo: "M-001",
                    competitorNumber: 1,
                    name: "Alex",
                    club: "Club A",
                    ageGroupId: "A",
                    genderGroup: "M",
                    categoryId: "BBC",
                    ageGroup: { name: "Adult" },
                    category: { name: "Barebow Compound" },
                },
            ],
            rounds: [{ dayOrder: 1, rangeNumber: 1, tournamentId: "t1" }],
            scores: [{ tournamentId: "t1", membershipNo: "M-001", rawScore: 290 }],
            enrollmentByTournament: { t1: ["M-001"] },
        })

        expect(standings?.complete[0]?.competitors[0]?.totalLabel).toBe("290")
    })
})
