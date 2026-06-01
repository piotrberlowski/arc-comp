import { buildChampionshipCombinedIfafExportData } from "../buildChampionshipCombinedIfafExportData"

describe("buildChampionshipCombinedIfafExportData", () => {
    const registrations = [
        {
            membershipNo: "M-001",
            competitorNumber: 1,
            name: "Alex",
            club: "Club A",
            ageGroupId: "S",
            genderGroup: "M",
            categoryId: "BBC",
            ageGroup: { name: "Senior" },
            category: { name: "Barebow Compound" },
        },
    ]

    const rounds = [
        { dayOrder: 1, rangeNumber: 1, tournamentId: "t1" },
        { dayOrder: 2, rangeNumber: 2, tournamentId: "t2" },
    ]

    it("returns null when rangeCount is 1", () => {
        expect(
            buildChampionshipCombinedIfafExportData({
                championshipName: "Test",
                organizerClub: "Club",
                rangeFormatNames: ["3D-Standard Round"],
                rangeFormatShortNames: ["3D-Std"],
                rangeCount: 1,
                dateStart: new Date("2024-06-01"),
                dateEnd: new Date("2024-06-01"),
                registrations,
                rounds,
                scores: [{ tournamentId: "t1", membershipNo: "M-001", rawScore: 100 }],
                enrollmentByTournament: { t1: ["M-001"] },
            })
        ).toBeNull()
    })

    it("maps range and combined scores for multi-range championships", () => {
        const data = buildChampionshipCombinedIfafExportData({
            championshipName: "Field Champs",
            organizerClub: "Host Club",
            rangeFormatNames: ["3D-Standard Round", "Field Round"],
            rangeFormatShortNames: ["3D-Std", "Field"],
            rangeCount: 2,
            dateStart: new Date("2024-06-01"),
            dateEnd: new Date("2024-06-03"),
            registrations,
            rounds,
            scores: [
                { tournamentId: "t1", membershipNo: "M-001", rawScore: 280 },
                { tournamentId: "t2", membershipNo: "M-001", rawScore: 275 },
            ],
            enrollmentByTournament: {
                t1: ["M-001"],
                t2: ["M-001"],
            },
        })

        expect(data?.participants[0]?.scoreColumns).toEqual(["280", "275", "555"])
        expect(data?.roundLabel).toBe("3D-Standard Round, Field Round")
        expect(data?.scoreColumnHeaders).toEqual(["3D-Std", "Field", "total"])
    })
})
