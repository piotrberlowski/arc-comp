import type { GenderGroup } from "@/generated/prisma/client"
import { participantDivisionAbbrev } from "@/lib/participantProfileFields"

export type ChampionshipDivision = {
    ageGroupId: string
    categoryId: string
    genderGroup: GenderGroup
    ageGroupName: string
    categoryName: string
}

export function championshipDivisionKey(
    ageGroupId: string,
    genderGroup: GenderGroup,
    categoryId: string
): string {
    return `${ageGroupId}:${genderGroup}:${categoryId}`
}

export function championshipDivisionLabel(division: ChampionshipDivision): string {
    return `${division.ageGroupName} ${division.genderGroup} ${division.categoryName}`
}

export function isCubAgeGroupName(ageGroupName: string): boolean {
    return /\bcub\b/i.test(ageGroupName)
}

export function compareDivisionsForMatrix(a: ChampionshipDivision, b: ChampionshipDivision): number {
    const aCub = isCubAgeGroupName(a.ageGroupName)
    const bCub = isCubAgeGroupName(b.ageGroupName)
    if (aCub !== bCub) {
        return aCub ? -1 : 1
    }
    return participantDivisionAbbrev(a).localeCompare(participantDivisionAbbrev(b))
}

export function enrollmentDayKey(dayOrder: number): string {
    return String(dayOrder)
}

export function enrollmentSlotKey(dayOrder: number, rangeNumber: number): string {
    return `${dayOrder}:${rangeNumber}`
}

export function isEnrolledOnChampionshipDay(
    slots: { dayOrder: number }[],
    dayOrder: number
): boolean {
    return slots.some((slot) => slot.dayOrder === dayOrder)
}

export function parseEnrollmentSlotKey(key: string): { dayOrder: number; rangeNumber: number } | null {
    const [dayOrder, rangeNumber] = key.split(":").map((part) => Number(part))
    if (!Number.isInteger(dayOrder) || !Number.isInteger(rangeNumber) || dayOrder < 1 || rangeNumber < 1) {
        return null
    }
    return { dayOrder, rangeNumber }
}
