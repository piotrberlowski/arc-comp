import {
    applyParticipantListView,
    compareParticipantListOrder,
    filterGroupedParticipantsByName,
    filterParticipantsByName,
    matchesParticipantName,
    parseParticipantSortKey,
} from "../participantListView"

describe("participantListView", () => {
    const alex = { name: "Alex Archer", membershipNo: "10", categoryId: "R" }
    const blair = { name: "Blair Bow", membershipNo: "2", categoryId: "BB" }
    const casey = { name: "Casey Compound", membershipNo: "3", categoryId: "BB" }

    it("parses known sort keys and defaults to name", () => {
        expect(parseParticipantSortKey("membershipNo")).toBe("membershipNo")
        expect(parseParticipantSortKey("bowstyle")).toBe("bowstyle")
        expect(parseParticipantSortKey("name")).toBe("name")
        expect(parseParticipantSortKey("unknown")).toBe("name")
    })

    it("matches names case-insensitively and ignores blank queries", () => {
        expect(matchesParticipantName("Alex Archer", "")).toBe(true)
        expect(matchesParticipantName("Alex Archer", "  alex  ")).toBe(true)
        expect(matchesParticipantName("Alex Archer", "bow")).toBe(false)
    })

    it("filters by name then sorts by the selected key", () => {
        const sortedByMembership = applyParticipantListView(
            [alex, blair, casey],
            "l",
            "membershipNo"
        )
        expect(sortedByMembership.map((entry) => entry.name)).toEqual(["Blair Bow", "Alex Archer"])
    })

    it("sorts bowstyle then name, and does not mutate the input", () => {
        const input = [alex, casey, blair]
        const sorted = applyParticipantListView(input, "", "bowstyle")
        expect(sorted.map((entry) => entry.name)).toEqual(["Blair Bow", "Casey Compound", "Alex Archer"])
        expect(input.map((entry) => entry.name)).toEqual(["Alex Archer", "Casey Compound", "Blair Bow"])
    })

    it("uses numeric membership comparison", () => {
        expect(compareParticipantListOrder(alex, blair, "membershipNo")).toBeGreaterThan(0)
    })

    it("filters by name without changing order", () => {
        const ordered = filterParticipantsByName([casey, alex, blair], "l")
        expect(ordered.map((entry) => entry.name)).toEqual(["Alex Archer", "Blair Bow"])
    })

    it("filters grouped participants by name and keeps assigned counts", () => {
        const visible = filterGroupedParticipantsByName(
            [{ groupNumber: 1, participants: [casey, alex, blair] }],
            "l"
        )
        expect(visible[0]?.assignedCount).toBe(3)
        expect(visible[0]?.participants.map((entry) => entry.name)).toEqual(["Alex Archer", "Blair Bow"])
    })
})
