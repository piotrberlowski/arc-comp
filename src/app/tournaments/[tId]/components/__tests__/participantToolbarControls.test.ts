import ParticipantCheckinFilter from "../ParticipantCheckinFilter"
import ParticipantNameFilter from "../ParticipantNameFilter"
import ParticipantSortSelect, { compareParticipants } from "../ParticipantSortSelect"

describe("participant toolbar controls", () => {
    const alex = {
        name: "Alex Archer",
        membershipNo: "10",
        club: "Zebra",
        ageGroupId: "S",
        genderGroup: "M",
        categoryId: "R",
        checkedIn: true,
    }
    const blair = {
        name: "Blair Bow",
        membershipNo: "2",
        club: "Alpha",
        ageGroupId: "A",
        genderGroup: "F",
        categoryId: "R",
        checkedIn: false,
    }
    const casey = {
        name: "Casey Compound",
        membershipNo: "3",
        club: "Alpha",
        ageGroupId: "A",
        genderGroup: "M",
        categoryId: "R",
        checkedIn: true,
    }

    it("filters by name", () => {
        expect(ParticipantNameFilter.filter([alex, blair], "alex").map((entry) => entry.name)).toEqual(["Alex Archer"])
        expect(ParticipantNameFilter.filter([alex], "").map((entry) => entry.name)).toEqual(["Alex Archer"])
    })

    it("filters by check-in", () => {
        expect(ParticipantCheckinFilter.filter([alex, blair, casey], "checked-in").map((entry) => entry.name)).toEqual([
            "Alex Archer",
            "Casey Compound",
        ])
    })

    it("sorts club then name, missing clubs first, without mutating", () => {
        const independent = { ...alex, name: "Drew Independent", membershipNo: "1", club: null }
        const input = [alex, casey, blair]
        expect(ParticipantSortSelect.sort(input, "club").map((entry) => entry.name)).toEqual([
            "Blair Bow",
            "Casey Compound",
            "Alex Archer",
        ])
        expect(input.map((entry) => entry.name)).toEqual(["Alex Archer", "Casey Compound", "Blair Bow"])
        expect(ParticipantSortSelect.sort([alex, independent], "club").map((entry) => entry.name)).toEqual([
            "Drew Independent",
            "Alex Archer",
        ])
    })

    it("sorts bow category then name", () => {
        expect(ParticipantSortSelect.sort([alex, casey, blair], "category").map((entry) => entry.name)).toEqual([
            "Blair Bow",
            "Casey Compound",
            "Alex Archer",
        ])
    })

    it("uses name as the tiebreaker", () => {
        expect(compareParticipants(casey, blair, "club")).toBeGreaterThan(0)
    })
})
