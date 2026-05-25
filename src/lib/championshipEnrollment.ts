import type { ChampionshipRegistration, GenderGroup } from "@/generated/prisma/client"
import { championshipDivisionKey } from "@/lib/championshipDivision"
import {
    canEnrollDivisionOnDay,
    type ChampionshipDivisionRangeRow,
    isDivisionRangeAssignmentComplete,
} from "@/lib/championshipRangeRules"

export type ChampionshipRegistrationProfile = Pick<
    ChampionshipRegistration,
    "name" | "membershipNo" | "competitorNumber" | "ageGroupId" | "categoryId" | "club" | "genderGroup"
>

export function participantDataFromRegistration(
    registration: ChampionshipRegistrationProfile,
    tournamentId: string
) {
    return {
        tournamentId,
        name: registration.name,
        membershipNo: registration.membershipNo,
        competitorNumber: registration.competitorNumber,
        ageGroupId: registration.ageGroupId,
        categoryId: registration.categoryId,
        club: registration.club,
        genderGroup: registration.genderGroup as GenderGroup,
        checkedIn: false,
    }
}

export function participantUpdateFromRegistration(registration: ChampionshipRegistrationProfile) {
    return {
        name: registration.name,
        competitorNumber: registration.competitorNumber,
        ageGroupId: registration.ageGroupId,
        categoryId: registration.categoryId,
        club: registration.club,
        genderGroup: registration.genderGroup as GenderGroup,
    }
}

export type ChampionshipEnrollmentSlot = {
    dayOrder: number
    rangeNumber: number
}

export function buildEnrollmentByMembership(
    rounds: { tournamentId: string; dayOrder: number; rangeNumber: number }[],
    enrollmentByTournament: Record<string, string[]>
): Record<string, ChampionshipEnrollmentSlot[]> {
    const enrollmentByMembership: Record<string, ChampionshipEnrollmentSlot[]> = {}

    for (const round of rounds) {
        for (const membershipNo of enrollmentByTournament[round.tournamentId] ?? []) {
            enrollmentByMembership[membershipNo] ??= []
            enrollmentByMembership[membershipNo].push({
                dayOrder: round.dayOrder,
                rangeNumber: round.rangeNumber,
            })
        }
    }

    return enrollmentByMembership
}

export type ChampionshipRosterDayColumn = {
    dayOrder: number
    label: string
}

export function listChampionshipRosterDays(
    rounds: { dayOrder: number; label?: string }[]
): ChampionshipRosterDayColumn[] {
    const seen = new Set<number>()
    const days: ChampionshipRosterDayColumn[] = []

    for (const round of [...rounds].sort((a, b) => a.dayOrder - b.dayOrder)) {
        if (seen.has(round.dayOrder)) {
            continue
        }
        seen.add(round.dayOrder)
        days.push({
            dayOrder: round.dayOrder,
            label: round.label ?? `Day ${round.dayOrder}`,
        })
    }

    return days
}

export type ChampionshipEnrollmentEligibility = Record<string, Record<number, boolean>>

type DivisionKeyParts = {
    ageGroupId: string
    categoryId: string
    genderGroup: string
}

export function buildUniqueRegistrationDivisions(
    registrations: DivisionKeyParts[]
): DivisionKeyParts[] {
    const byKey = new Map<string, DivisionKeyParts>()
    for (const registration of registrations) {
        const key = championshipDivisionKey(
            registration.ageGroupId,
            registration.genderGroup as GenderGroup,
            registration.categoryId
        )
        if (!byKey.has(key)) {
            byKey.set(key, registration)
        }
    }
    return [...byKey.values()]
}

export function buildChampionshipEnrollmentEligibility(
    registrations: DivisionKeyParts[],
    dayOrders: number[],
    assignments: ChampionshipDivisionRangeRow[],
    rangeCount: number
): ChampionshipEnrollmentEligibility {
    const eligibility: ChampionshipEnrollmentEligibility = {}

    for (const registration of registrations) {
        const divisionKey = championshipDivisionKey(
            registration.ageGroupId,
            registration.genderGroup as GenderGroup,
            registration.categoryId
        )
        eligibility[divisionKey] = Object.fromEntries(
            dayOrders.map((dayOrder) => [
                dayOrder,
                canEnrollDivisionOnDay(
                    assignments,
                    rangeCount,
                    dayOrder,
                    registration.ageGroupId,
                    registration.categoryId,
                    registration.genderGroup
                ),
            ])
        )
    }

    return eligibility
}

export function areChampionshipRangeAssignmentsComplete(
    registrations: DivisionKeyParts[],
    dayOrders: number[],
    assignments: ChampionshipDivisionRangeRow[],
    rangeCount: number
): boolean {
    return isDivisionRangeAssignmentComplete(
        buildUniqueRegistrationDivisions(registrations),
        dayOrders,
        assignments,
        rangeCount
    )
}

export function filterMembershipNosEligibleOnDay(
    assignments: ChampionshipDivisionRangeRow[],
    rangeCount: number,
    dayOrder: number,
    membershipNos: string[],
    membershipByNo: Map<string, DivisionKeyParts & { membershipNo: string }>
): string[] {
    return membershipNos.filter((membershipNo) => {
        const registration = membershipByNo.get(membershipNo)
        if (!registration) {
            return false
        }
        return canEnrollDivisionOnDay(
            assignments,
            rangeCount,
            dayOrder,
            registration.ageGroupId,
            registration.categoryId,
            registration.genderGroup
        )
    })
}
