import {
    compareGroupAssignmentOrder,
    groupUsesExplicitPositions,
    nextPositionInGroup,
    orderedParticipantIdsAfterMoveToCaptain,
    orderedParticipantIdsAfterRemoval,
    sortByGroupAssignmentOrder,
} from "@/lib/groupAssignmentOrder"

describe("groupAssignmentOrder", () => {
    const participant = (
        id: string,
        positionInGroup: number,
        isCaptain = false
    ) => ({
        id,
        groupAssignment: { positionInGroup, isCaptain },
    })

    it("sorts explicit positions in numeric order", () => {
        const sorted = sortByGroupAssignmentOrder([
            participant("c", 3),
            participant("a", 1, true),
            participant("b", 2),
        ])

        expect(sorted.map((entry) => entry.id)).toEqual(["a", "b", "c"])
    })

    it("places positioned archers before legacy zero positions", () => {
        const sorted = sortByGroupAssignmentOrder([
            participant("legacy", 0),
            participant("seeded", 2),
            participant("captain", 1, true),
        ])

        expect(sorted.map((entry) => entry.id)).toEqual(["captain", "seeded", "legacy"])
    })

    it("keeps legacy order with captain first then id", () => {
        const sorted = sortByGroupAssignmentOrder([
            participant("b", 0),
            participant("a", 0, true),
            participant("c", 0),
        ])

        expect(sorted.map((entry) => entry.id)).toEqual(["a", "b", "c"])
    })

    it("returns next explicit position or zero for legacy groups", () => {
        expect(nextPositionInGroup([{ positionInGroup: 4 }, { positionInGroup: 2 }])).toBe(5)
        expect(nextPositionInGroup([{ positionInGroup: 0 }, { positionInGroup: 0 }])).toBe(0)
        expect(groupUsesExplicitPositions([{ positionInGroup: 0 }, { positionInGroup: 1 }])).toBe(true)
    })

    it("moves captain to position 1 and preserves relative order", () => {
        const participants = [
            participant("first", 1, true),
            participant("second", 2),
            participant("third", 3),
        ]

        expect(orderedParticipantIdsAfterMoveToCaptain(participants, "third")).toEqual([
            "third",
            "first",
            "second",
        ])
        expect(orderedParticipantIdsAfterRemoval(participants, "second")).toEqual(["first", "third"])
    })

    it("compareGroupAssignmentOrder is consistent with sort", () => {
        const participants = [
            participant("b", 0),
            participant("a", 0, true),
        ]
        expect(compareGroupAssignmentOrder(participants[0], participants[1])).toBeGreaterThan(0)
    })
})
