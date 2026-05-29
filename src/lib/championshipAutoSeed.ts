import {
    championshipCategoryKey,
    compareCompetitorsForAutoSeed,
    type CompetitorStanding,
} from "@/lib/championshipCombinedStandings"
import { findDivisionRangeAssignment } from "@/lib/championshipRangeRules"
import type { ChampionshipDivisionRangeRow } from "@/lib/championshipRangeRules"

export type AutoSeedParticipant = {
    id: string
    membershipNo: string
    competitorNumber: number
    ageGroupId: string
    categoryId: string
    genderGroup: string
}

export type GroupSeedAssignment = {
    participantId: string
    groupNumber: number
    positionInGroup: number
    isCaptain: boolean
}

export type AutoSeedTargetRange = {
    firstTarget: number
    targetCount: number
}

export type TournamentAutoSeedPlan = {
    tournamentId: string
    rangeNumber: number
    assignments: GroupSeedAssignment[]
    warnings: string[]
}

type SeedUnit = {
    participants: AutoSeedParticipant[]
    label: string
}

type TargetSlotState = {
    groupNumber: number
    participants: AutoSeedParticipant[]
}

export function validateAutoSeedTargetRange(
    targetRange: AutoSeedTargetRange,
    endCount: number
): string | null {
    if (targetRange.firstTarget < 1) {
        return "First target must be at least 1"
    }
    if (targetRange.targetCount < 1) {
        return "Provide at least one target to fill"
    }

    const lastTarget = targetRange.firstTarget + targetRange.targetCount - 1
    if (lastTarget > endCount) {
        return `Targets must be within 1–${endCount} for this tournament format`
    }

    return null
}

function orderParticipantsForAutoSeed(
    participants: AutoSeedParticipant[],
    divisionCompetitors: CompetitorStanding[],
    priorDayOrders: number[]
): AutoSeedParticipant[] {
    const standingByMembership = new Map(
        divisionCompetitors.map((competitor) => [competitor.membershipNo, competitor])
    )

    return [...participants].sort((left, right) => {
        const leftStanding = standingByMembership.get(left.membershipNo)
        const rightStanding = standingByMembership.get(right.membershipNo)

        if (leftStanding && rightStanding) {
            return compareCompetitorsForAutoSeed(leftStanding, rightStanding, priorDayOrders)
        }
        if (leftStanding) {
            return -1
        }
        if (rightStanding) {
            return 1
        }

        return left.competitorNumber - right.competitorNumber
    })
}

function splitStandingBlocks(
    ordered: AutoSeedParticipant[],
    blockSize: number
): AutoSeedParticipant[][] {
    const blocks: AutoSeedParticipant[][] = []
    for (let index = 0; index < ordered.length; index += blockSize) {
        blocks.push(ordered.slice(index, index + blockSize))
    }
    return blocks
}

function buildSeedUnitsForDivision(
    ordered: AutoSeedParticipant[],
    blockSize: number,
    divisionLabel: string
): { standingBlocks: SeedUnit[]; smallDivision: SeedUnit | null } {
    if (ordered.length < blockSize) {
        return {
            standingBlocks: [],
            smallDivision: { participants: ordered, label: divisionLabel },
        }
    }

    const blocks = splitStandingBlocks(ordered, blockSize)
    return {
        standingBlocks: blocks.map((participants, index) => ({
            participants,
            label: `${divisionLabel} seeds ${index * blockSize + 1}–${index * blockSize + participants.length}`,
        })),
        smallDivision: null,
    }
}

function createTargetSlots(firstTarget: number, targetCount: number): TargetSlotState[] {
    return Array.from({ length: targetCount }, (_, index) => ({
        groupNumber: firstTarget + index,
        participants: [],
    }))
}

function findBestTargetSlot(
    slots: TargetSlotState[],
    unitSize: number,
    groupSize: number
): TargetSlotState | null {
    const candidates = slots.filter((slot) => slot.participants.length + unitSize <= groupSize)
    if (candidates.length === 0) {
        return null
    }

    return candidates.reduce((best, slot) => {
        if (slot.participants.length !== best.participants.length) {
            return slot.participants.length < best.participants.length ? slot : best
        }
        return slot.groupNumber < best.groupNumber ? slot : best
    })
}

function assignSeedUnit(
    slots: TargetSlotState[],
    unit: SeedUnit,
    groupSize: number
): string | null {
    const target = findBestTargetSlot(slots, unit.participants.length, groupSize)
    if (!target) {
        return `Could not place ${unit.label} (${unit.participants.length} archers) within the selected targets`
    }

    target.participants.push(...unit.participants)
    return null
}

function assignUnitsBalanced(
    units: SeedUnit[],
    targetRange: AutoSeedTargetRange,
    groupSize: number
): { assignments: GroupSeedAssignment[]; warnings: string[] } {
    const slots = createTargetSlots(targetRange.firstTarget, targetRange.targetCount)
    const warnings: string[] = []
    const sortedUnits = [...units].sort((left, right) => right.participants.length - left.participants.length)

    for (const unit of sortedUnits) {
        const warning = assignSeedUnit(slots, unit, groupSize)
        if (warning) {
            warnings.push(warning)
        }
    }

    const assignments: GroupSeedAssignment[] = []
    for (const slot of slots) {
        for (const [index, participant] of slot.participants.entries()) {
            assignments.push({
                participantId: participant.id,
                groupNumber: slot.groupNumber,
                positionInGroup: index + 1,
                isCaptain: index === 0,
            })
        }
    }

    return { assignments, warnings }
}

export function buildTournamentAutoSeedPlan({
    tournamentId,
    rangeNumber,
    groupSize,
    endCount,
    targetRange,
    participants,
    priorDayOrders,
    competitorStandingsByCategory,
}: {
    tournamentId: string
    rangeNumber: number
    groupSize: number
    endCount: number
    targetRange: AutoSeedTargetRange
    participants: AutoSeedParticipant[]
    priorDayOrders: number[]
    competitorStandingsByCategory: Map<string, CompetitorStanding[]>
}): TournamentAutoSeedPlan {
    const warnings: string[] = []
    const rangeError = validateAutoSeedTargetRange(targetRange, endCount)
    if (rangeError) {
        return { tournamentId, rangeNumber, assignments: [], warnings: [rangeError] }
    }

    const byCategory = new Map<string, AutoSeedParticipant[]>()
    for (const participant of participants) {
        const categoryKey = championshipCategoryKey(
            participant.ageGroupId,
            participant.genderGroup,
            participant.categoryId
        )
        const existing = byCategory.get(categoryKey) ?? []
        existing.push(participant)
        byCategory.set(categoryKey, existing)
    }

    const seedUnits: SeedUnit[] = []

    for (const [categoryKey, categoryParticipants] of byCategory) {
        const divisionCompetitors = competitorStandingsByCategory.get(categoryKey) ?? []
        const ordered = orderParticipantsForAutoSeed(
            categoryParticipants,
            divisionCompetitors,
            priorDayOrders
        )
        const divisionLabel = categoryParticipants[0]
            ? `${categoryParticipants[0].genderGroup} ${categoryKey}`
            : categoryKey
        const { standingBlocks, smallDivision } = buildSeedUnitsForDivision(
            ordered,
            groupSize,
            divisionLabel
        )

        seedUnits.push(...standingBlocks)
        if (smallDivision) {
            seedUnits.push(smallDivision)
        }
    }

    const balanced = assignUnitsBalanced(seedUnits, targetRange, groupSize)

    return {
        tournamentId,
        rangeNumber,
        assignments: balanced.assignments,
        warnings: [...warnings, ...balanced.warnings],
    }
}

const AUTO_SEED_NOT_APPLIED =
    "Auto-seed was not applied. Existing group assignments on this range are unchanged."

export function formatAutoSeedFailureMessage(error: unknown): string {
    if (!(error instanceof Error)) {
        return AUTO_SEED_NOT_APPLIED
    }

    const detail = error.message.trim()
    if (!detail) {
        return AUTO_SEED_NOT_APPLIED
    }

    if (detail.startsWith(AUTO_SEED_NOT_APPLIED)) {
        return detail
    }

    return `${AUTO_SEED_NOT_APPLIED}\n\n${detail}`
}

export function formatAutoSeedValidationMessage(message: string): string {
    return `Check the target range and try again.\n\n${message}`
}

export function assertAutoSeedPlanIsComplete(
    plan: TournamentAutoSeedPlan,
    eligibleParticipantIds: string[]
): void {
    if (plan.warnings.length > 0) {
        throw new Error(
            `${AUTO_SEED_NOT_APPLIED}\n\n${plan.warnings.map((warning) => `• ${warning}`).join("\n")}`
        )
    }

    const assignedIds = new Set(plan.assignments.map((assignment) => assignment.participantId))
    const unassignedCount = eligibleParticipantIds.filter((participantId) => !assignedIds.has(participantId))
        .length

    if (unassignedCount > 0) {
        throw new Error(
            `${AUTO_SEED_NOT_APPLIED}\n\n• Auto-seed did not assign ${unassignedCount} archer(s). Add targets or complete prior-day standings, then try again.`
        )
    }
}

export function participantAllowedOnRangeForDay(
    participant: Pick<AutoSeedParticipant, "ageGroupId" | "categoryId" | "genderGroup">,
    dayOrder: number,
    rangeNumber: number,
    assignments: ChampionshipDivisionRangeRow[]
): boolean {
    const assignedRange = findDivisionRangeAssignment(
        assignments,
        dayOrder,
        participant.ageGroupId,
        participant.categoryId,
        participant.genderGroup
    )
    return assignedRange === rangeNumber
}
