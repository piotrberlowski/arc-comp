import { countChampionshipMedals } from "@/lib/championshipMedalCount"

function registration(
    ageGroupId: string,
    genderGroup: string,
    categoryId: string
) {
    return { ageGroupId, genderGroup, categoryId }
}

describe("countChampionshipMedals", () => {
    it("returns zeros when nobody is registered", () => {
        expect(countChampionshipMedals([])).toEqual({ gold: 0, silver: 0, bronze: 0 })
    })

    it("awards only gold for a category with one competitor", () => {
        expect(countChampionshipMedals([registration("AD", "M", "BB")])).toEqual({
            gold: 1,
            silver: 0,
            bronze: 0,
        })
    })

    it("awards gold and silver for a category with two competitors", () => {
        expect(
            countChampionshipMedals([
                registration("AD", "M", "BB"),
                registration("AD", "M", "BB"),
            ])
        ).toEqual({ gold: 1, silver: 1, bronze: 0 })
    })

    it("awards a full set for a category with three or more competitors", () => {
        expect(
            countChampionshipMedals([
                registration("AD", "M", "BB"),
                registration("AD", "M", "BB"),
                registration("AD", "M", "BB"),
                registration("AD", "M", "BB"),
            ])
        ).toEqual({ gold: 1, silver: 1, bronze: 1 })
    })

    it("treats age, gender, and equipment as separate combined-standings categories", () => {
        expect(
            countChampionshipMedals([
                registration("AD", "M", "BB"),
                registration("AD", "F", "BB"),
                registration("JV", "M", "BB"),
                registration("AD", "M", "FS"),
            ])
        ).toEqual({ gold: 4, silver: 0, bronze: 0 })
    })

    it("sums medals across mixed category sizes", () => {
        expect(
            countChampionshipMedals([
                registration("AD", "M", "BB"),
                registration("AD", "F", "BB"),
                registration("AD", "F", "BB"),
                registration("JV", "M", "FS"),
                registration("JV", "M", "FS"),
                registration("JV", "M", "FS"),
            ])
        ).toEqual({ gold: 3, silver: 2, bronze: 1 })
    })
})
