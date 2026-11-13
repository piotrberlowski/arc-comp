import type { GroupSeedAssignment } from "@/lib/championshipAutoSeed"
import {
    solveMIP,
    validateCompetitors,
    type Competitor,
    type SolutionSpace,
} from "group-planner"

export type RoundSeedArcher = {
    id: string
    genderGroup: string
    ageGroupId: string
    categoryId: string
}

const closedGroupWeight = 8
const equipmentClassWeight = 4
const genderWeight = 2
const ageCategoryWeight = 1

function shuffle<T>(items: T[], random: () => number): T[] {
    const copy = [...items]
    for (let index = copy.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1))
        const current = copy[index]
        copy[index] = copy[swapIndex]
        copy[swapIndex] = current
    }
    return copy
}

export function pairingSeedAllowed(dayOrder: number | null | undefined): boolean {
    return dayOrder == null || dayOrder === 1
}

function assertRoundLimits(groupSize: number, endCount: number): void {
    if (!Number.isInteger(groupSize) || groupSize < 3) {
        throw new Error("Seeding needs a group size of at least 3")
    }
    if (!Number.isInteger(endCount) || endCount < 1) {
        throw new Error("The round needs at least one target")
    }
}

function solutionSpaceFor(archers: RoundSeedArcher[]): SolutionSpace {
    return {
        equipmentClasses: [...new Set(archers.map((archer) => archer.categoryId))],
        ageCategories: [...new Set(archers.map((archer) => archer.ageGroupId))],
        genders: [...new Set(archers.map((archer) => archer.genderGroup))],
    }
}

function toCompetitor(archer: RoundSeedArcher): Competitor {
    return {
        id: archer.id,
        equipmentClass: archer.categoryId,
        ageCategory: archer.ageGroupId,
        gender: archer.genderGroup,
    }
}

function partitionOptions(groupSize: number, endCount: number, solutionSpace: SolutionSpace) {
    return {
        groupByEquipmentClass: true,
        minSubsetSize: 3,
        maxSubsetSize: groupSize,
        preferredSubsetSize: groupSize,
        maxSubsets: endCount,
        closedGroupWeight,
        equipmentClassWeight,
        genderWeight,
        ageCategoryWeight,
        solutionSpace,
    }
}

function assignmentsForGroup(
    subset: Competitor[],
    groupNumber: number,
    groupSize: number,
    random: () => number
): GroupSeedAssignment[] {
    if (subset.length > groupSize) {
        throw new Error("Seeding filled a group past its size")
    }

    return shuffle(subset, random).map((competitor, index) => ({
        participantId: competitor.id,
        groupNumber,
        positionInGroup: index + 1,
        isCaptain: index === 0,
    }))
}

function assignmentsFrom(
    subsets: Competitor[][],
    groupSize: number,
    endCount: number,
    random: () => number
): GroupSeedAssignment[] {
    if (subsets.length > endCount) {
        throw new Error("Seeding needs more targets than this round has")
    }

    return subsets.flatMap((subset, index) =>
        assignmentsForGroup(subset, index + 1, groupSize, random)
    )
}

export function seedRoundGroups(
    archers: RoundSeedArcher[],
    groupSize: number,
    endCount: number,
    random: () => number = Math.random
): GroupSeedAssignment[] {
    assertRoundLimits(groupSize, endCount)
    if (archers.length === 0) {
        return []
    }

    const ordered = shuffle(archers, random)
    const solutionSpace = solutionSpaceFor(ordered)
    const competitors = ordered.map(toCompetitor)
    const validation = validateCompetitors(competitors, solutionSpace)
    if (!validation.valid) {
        throw new Error(validation.errors.join("\n"))
    }

    const solved = solveMIP(competitors, partitionOptions(groupSize, endCount, solutionSpace))
    const assignments = assignmentsFrom(solved.result.subsets, groupSize, endCount, random)
    if (assignments.length !== archers.length) {
        const leftOut = archers.length - assignments.length
        throw new Error(
            `Seeding left ${leftOut} archer(s) unassigned. A target needs at least 3 archers, so a remainder of 1 or 2 is not placed.`
        )
    }
    return assignments
}
