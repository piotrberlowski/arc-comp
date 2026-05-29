import {
    createGroupAssignments,
    mapSeedAssignmentsToCreateRows,
    type GroupAssignmentCreateRow,
} from "@/lib/groupAssignmentCreate"

describe("groupAssignmentCreate", () => {
    it("maps seed assignments to create rows", () => {
        const rows = mapSeedAssignmentsToCreateRows("tournament-1", [
            {
                participantId: "p-1",
                groupNumber: 2,
                positionInGroup: 1,
                isCaptain: true,
            },
            {
                participantId: "p-2",
                groupNumber: 2,
                positionInGroup: 2,
                isCaptain: false,
            },
        ])

        expect(rows).toEqual([
            {
                participantId: "p-1",
                tournamentId: "tournament-1",
                groupNumber: 2,
                positionInGroup: 1,
                isCaptain: true,
            },
            {
                participantId: "p-2",
                tournamentId: "tournament-1",
                groupNumber: 2,
                positionInGroup: 2,
                isCaptain: false,
            },
        ] satisfies GroupAssignmentCreateRow[])
    })

    it("rejects duplicate participants", () => {
        expect(() =>
            mapSeedAssignmentsToCreateRows("tournament-1", [
                {
                    participantId: "p-1",
                    groupNumber: 1,
                    positionInGroup: 1,
                    isCaptain: true,
                },
                {
                    participantId: "p-1",
                    groupNumber: 2,
                    positionInGroup: 1,
                    isCaptain: true,
                },
            ])
        ).toThrow("duplicate participant")
    })

    it("creates rows through the transaction helper", async () => {
        const createMany = jest.fn().mockResolvedValue({ count: 1 })
        const rows = mapSeedAssignmentsToCreateRows("tournament-1", [
            {
                participantId: "p-1",
                groupNumber: 1,
                positionInGroup: 1,
                isCaptain: true,
            },
        ])

        await createGroupAssignments({ groupAssignment: { createMany } }, rows)

        expect(createMany).toHaveBeenCalledWith({ data: rows })
    })
})
