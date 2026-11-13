import { seedRoundGroups, type RoundSeedArcher } from "@/lib/roundGroupSeed"

function archer(id: string, categoryId: string, ageGroupId = "A", genderGroup = "M"): RoundSeedArcher {
    return { id, categoryId, ageGroupId, genderGroup }
}

function keepOrder(): number {
    return 0.999999
}

function idsInGroup(assignments: { participantId: string; groupNumber: number }[], groupNumber: number) {
    return assignments
        .filter((assignment) => assignment.groupNumber === groupNumber)
        .map((assignment) => assignment.participantId)
        .sort()
}

describe("seedRoundGroups", () => {
    it("keeps one bowstyle together when it fills a group", () => {
        const archers = [
            archer("a1", "FSR"),
            archer("a2", "FSR"),
            archer("a3", "FSR"),
            archer("a4", "FSR"),
            archer("b1", "HB"),
            archer("b2", "HB"),
            archer("b3", "HB"),
            archer("b4", "HB"),
        ]

        const assignments = seedRoundGroups(archers, 4, 4, keepOrder)
        const styles = new Map(archers.map((entry) => [entry.id, entry.categoryId]))
        const grouped = new Map<number, string[]>()
        for (const assignment of assignments) {
            const style = styles.get(assignment.participantId)
            const current = grouped.get(assignment.groupNumber) ?? []
            if (style) {
                current.push(style)
            }
            grouped.set(assignment.groupNumber, current)
        }

        expect(assignments).toHaveLength(8)
        expect(grouped.size).toBe(2)
        for (const stylesInGroup of grouped.values()) {
            expect(new Set(stylesInGroup).size).toBe(1)
            expect(stylesInGroup).toHaveLength(4)
        }
        expect(idsInGroup(assignments, 1)).toEqual(["a1", "a2", "a3", "a4"])
    })

    it("does not put an archer into a group that is already full", () => {
        const archers = [
            archer("a1", "FSR"),
            archer("a2", "FSR"),
            archer("a3", "FSR"),
            archer("a4", "FSR"),
            archer("a5", "FSR"),
            archer("b1", "PFAA-ETR"),
            archer("b2", "PFAA-ETR"),
            archer("b3", "PFAA-ETR"),
        ]

        const assignments = seedRoundGroups(archers, 4, 4, keepOrder)
        const sizes = new Map<number, number>()
        for (const assignment of assignments) {
            sizes.set(assignment.groupNumber, (sizes.get(assignment.groupNumber) ?? 0) + 1)
        }

        expect(assignments).toHaveLength(8)
        for (const size of sizes.values()) {
            expect(size).toBeGreaterThanOrEqual(3)
            expect(size).toBeLessThanOrEqual(4)
        }
    })

    it("refuses a group size below 3", () => {
        expect(() => seedRoundGroups([archer("a1", "HB"), archer("a2", "HB"), archer("a3", "HB")], 2, 4)).toThrow(
            "Seeding needs a group size of at least 3"
        )
    })

    it("leaves a single leftover unassigned instead of opening a short target", () => {
        const archers = ["a1", "a2", "a3", "a4", "a5"].map((id) => archer(id, "HB"))

        expect(() => seedRoundGroups(archers, 4, 4, keepOrder)).toThrow(
            "Seeding left 1 archer(s) unassigned"
        )
    })
})
