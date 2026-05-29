import { groupsFromParticipants } from "../publicTournamentGroups"

describe("groupsFromParticipants", () => {
    it("assigns participants to target buckets and sorts unassigned by name", () => {
        const { groups, unassigned } = groupsFromParticipants(2, [
            {
                id: "p2",
                membershipNo: "M2",
                competitorNumber: 2,
                name: "Zara",
                club: null,
                groupAssignment: null,
            },
            {
                id: "p1",
                membershipNo: "M1",
                competitorNumber: 1,
                name: "Amy",
                club: "ClubA",
                groupAssignment: { groupNumber: 1, isCaptain: true, positionInGroup: 1 },
            },
        ])

        expect(unassigned.map((row) => row.name)).toEqual(["Zara"])
        expect(groups[0].participants).toHaveLength(1)
        expect(groups[0].participants[0]).toMatchObject({ name: "Amy", isCaptain: true })
        expect(groups[1].participants).toHaveLength(0)
    })
})
