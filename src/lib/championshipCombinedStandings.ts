import type { ChampionshipEnrollmentSlot } from "@/lib/championshipEnrollment"
import { participantDivisionAbbrev } from "@/lib/participantProfileFields"
import {
    formatParticipantResultDisplay,
    toResult,
    type ParticipantResult,
} from "@/lib/scoreUtils"

export type ChampionshipRoundRef = {
    tournamentId: string
    dayOrder: number
    rangeNumber: number
}

export type ChampionshipDay = {
    dayOrder: number
    tournamentId: string
    label: string
}

export type RegisteredCompetitor = {
    membershipNo: string
    competitorNumber: number
    name: string
    club: string
    ageGroupId: string
    ageGroupName: string
    categoryId: string
    categoryName: string
    genderGroup: string
}

export type DayScoreInput = {
    tournamentId: string
    membershipNo: string
    rawScore: number | null
}

type DayScoreStatus =
    | { kind: "not_enrolled" }
    | { kind: "pending" }
    | { kind: "scored"; rawScore: number; result: ParticipantResult }

export type CompetitorStanding = {
    membershipNo: string
    competitorNumber: number
    name: string
    club: string
    ageGroupId: string
    categoryId: string
    genderGroup: string
    categoryName: string
    ageGroupName: string
    categoryKey: string
    categoryLabel: string
    scoresByDay: Record<number, DayScoreStatus>
    combinedTotal: number | null
    scoringComplete: boolean
}

type CategoryStandings = {
    categoryKey: string
    categoryLabel: string
    categoryName: string
    ageGroupName: string
    genderGroup: string
    scoringComplete: boolean
    competitors: CompetitorStanding[]
}

export type CompetitorStandingsEntry = {
    membershipNo: string
    competitorNumber: number
    name: string
    club: string
    place: number | null
    dayScoreLabels: string[]
    totalLabel: string
}

export type CategoryStandingsGroup = {
    categoryKey: string
    heading: string
    showPlaces: boolean
    competitors: CompetitorStandingsEntry[]
}

export type ChampionshipCombinedStandings = {
    days: { dayOrder: number; label: string }[]
    inProgress: CategoryStandingsGroup[]
    complete: CategoryStandingsGroup[]
    isEmpty: boolean
}

export function championshipCategoryKey(
    ageGroupId: string,
    genderGroup: string,
    categoryId: string
): string {
    return `${ageGroupId}${genderGroup}${categoryId}`
}

function compareAlphanumeric(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
}

export function compareCombinedStandingsCategories(
    a: { categoryName: string; ageGroupName: string; genderGroup: string },
    b: { categoryName: string; ageGroupName: string; genderGroup: string }
): number {
    const byBow = compareAlphanumeric(a.categoryName, b.categoryName)
    if (byBow !== 0) {
        return byBow
    }

    const byAge = compareAlphanumeric(a.ageGroupName, b.ageGroupName)
    if (byAge !== 0) {
        return byAge
    }

    return compareAlphanumeric(a.genderGroup, b.genderGroup)
}

function formatStandingsTotal(total: number | null): string {
    if (total === null) {
        return "—"
    }
    return Number.isInteger(total) ? String(total) : total.toFixed(3).replace(/\.?0+$/, "")
}

function completedScoreContribution(rawScore: number): number | null {
    const result = toResult(rawScore)
    if (result.status !== "COMPLETED") {
        return null
    }
    return rawScore
}

function sumCompletedDayTotals(scoresByDay: Record<number, DayScoreStatus>): number | null {
    let total = 0
    let hasContribution = false

    for (const dayScore of Object.values(scoresByDay)) {
        if (dayScore.kind !== "scored") {
            continue
        }
        const contribution = completedScoreContribution(dayScore.rawScore)
        if (contribution === null) {
            continue
        }
        total += contribution
        hasContribution = true
    }

    return hasContribution ? total : null
}

function resolveDayScoreStatus(
    enrolledSlots: ChampionshipEnrollmentSlot[],
    rounds: ChampionshipRoundRef[],
    dayOrder: number,
    scoresByTournament: Map<string, number>
): DayScoreStatus {
    const enrolledSlot = enrolledSlots.find((slot) => slot.dayOrder === dayOrder)
    if (!enrolledSlot) {
        return { kind: "not_enrolled" }
    }
    const round = rounds.find(
        (item) => item.dayOrder === dayOrder && item.rangeNumber === enrolledSlot.rangeNumber
    )
    if (!round) {
        return { kind: "not_enrolled" }
    }
    const rawScore = scoresByTournament.get(round.tournamentId)
    if (rawScore === undefined) {
        return { kind: "pending" }
    }
    return { kind: "scored", rawScore, result: toResult(rawScore) }
}

function calculateCompetitorStandings(
    registrations: RegisteredCompetitor[],
    days: ChampionshipDay[],
    rounds: ChampionshipRoundRef[],
    scores: DayScoreInput[],
    enrollmentByMembership: Record<string, ChampionshipEnrollmentSlot[]>
): CompetitorStanding[] {
    const scoresByMembershipTournament = new Map<string, Map<string, number>>()

    for (const score of scores) {
        if (score.rawScore === null) {
            continue
        }
        const byTournament = scoresByMembershipTournament.get(score.membershipNo) ?? new Map()
        byTournament.set(score.tournamentId, score.rawScore)
        scoresByMembershipTournament.set(score.membershipNo, byTournament)
    }

    return registrations.map((registration) => {
        const enrolledSlots = enrollmentByMembership[registration.membershipNo] ?? []
        const scoresForMember = scoresByMembershipTournament.get(registration.membershipNo) ?? new Map()
        const scoresByDay: Record<number, DayScoreStatus> = {}

        for (const day of days) {
            scoresByDay[day.dayOrder] = resolveDayScoreStatus(
                enrolledSlots,
                rounds,
                day.dayOrder,
                scoresForMember
            )
        }

        const scoringComplete =
            enrolledSlots.length > 0 &&
            enrolledSlots.every((slot) => {
                const round = rounds.find(
                    (item) => item.dayOrder === slot.dayOrder && item.rangeNumber === slot.rangeNumber
                )
                if (!round) {
                    return false
                }
                return scoresForMember.has(round.tournamentId)
            })

        return {
            membershipNo: registration.membershipNo,
            competitorNumber: registration.competitorNumber,
            name: registration.name,
            club: registration.club,
            ageGroupId: registration.ageGroupId,
            categoryId: registration.categoryId,
            genderGroup: registration.genderGroup,
            categoryName: registration.categoryName,
            ageGroupName: registration.ageGroupName,
            categoryKey: championshipCategoryKey(
                registration.ageGroupId,
                registration.genderGroup,
                registration.categoryId
            ),
            categoryLabel: participantDivisionAbbrev(registration),
            scoresByDay,
            combinedTotal: sumCompletedDayTotals(scoresByDay),
            scoringComplete,
        }
    })
}

function hasPriorDncOrDnf(competitor: CompetitorStanding, priorDayOrders: number[]): boolean {
    for (const dayOrder of priorDayOrders) {
        const dayScore = competitor.scoresByDay[dayOrder]
        if (dayScore?.kind !== "scored") {
            continue
        }
        if (dayScore.result.status === "DNC" || dayScore.result.status === "DNF") {
            return true
        }
    }
    return false
}

function autoSeedSortTier(competitor: CompetitorStanding, priorDayOrders: number[]): number {
    if (competitor.combinedTotal !== null) {
        return 0
    }
    if (hasPriorDncOrDnf(competitor, priorDayOrders)) {
        return 1
    }
    return 2
}

export function compareCompetitorsForAutoSeed(
    left: CompetitorStanding,
    right: CompetitorStanding,
    priorDayOrders: number[]
): number {
    const leftTier = autoSeedSortTier(left, priorDayOrders)
    const rightTier = autoSeedSortTier(right, priorDayOrders)
    if (leftTier !== rightTier) {
        return leftTier - rightTier
    }

    if (leftTier === 0) {
        return (right.combinedTotal ?? 0) - (left.combinedTotal ?? 0)
    }

    if (left.competitorNumber !== right.competitorNumber) {
        return left.competitorNumber - right.competitorNumber
    }

    return left.name.localeCompare(right.name)
}

export function buildCompetitorStandingsByCategory(
    registrations: RegisteredCompetitor[],
    days: ChampionshipDay[],
    rounds: ChampionshipRoundRef[],
    scores: DayScoreInput[],
    enrollmentByMembership: Record<string, ChampionshipEnrollmentSlot[]>
): Map<string, CompetitorStanding[]> {
    const grouped = new Map<string, CompetitorStanding[]>()

    for (const competitor of calculateCompetitorStandings(
        registrations,
        days,
        rounds,
        scores,
        enrollmentByMembership
    )) {
        const existing = grouped.get(competitor.categoryKey) ?? []
        existing.push(competitor)
        grouped.set(competitor.categoryKey, existing)
    }

    return grouped
}

function compareCompetitorStandings(a: CompetitorStanding, b: CompetitorStanding): number {
    if (a.scoringComplete !== b.scoringComplete) {
        return a.scoringComplete ? 1 : -1
    }

    const aTotal = a.combinedTotal ?? 0
    const bTotal = b.combinedTotal ?? 0
    if (aTotal !== bTotal) {
        return bTotal - aTotal
    }

    return a.name.localeCompare(b.name)
}

function groupStandingsByCategory(competitors: CompetitorStanding[]): CategoryStandings[] {
    const grouped = new Map<string, CompetitorStanding[]>()

    for (const competitor of competitors) {
        const existing = grouped.get(competitor.categoryKey) ?? []
        existing.push(competitor)
        grouped.set(competitor.categoryKey, existing)
    }

    return [...grouped.entries()]
        .map(([categoryKey, categoryCompetitors]) => {
            const sortedCompetitors = [...categoryCompetitors].sort(compareCompetitorStandings)
            return {
                categoryKey,
                categoryLabel: sortedCompetitors[0]?.categoryLabel ?? categoryKey,
                categoryName: sortedCompetitors[0]?.categoryName ?? "",
                ageGroupName: sortedCompetitors[0]?.ageGroupName ?? "",
                genderGroup: sortedCompetitors[0]?.genderGroup ?? "",
                scoringComplete: sortedCompetitors.every((competitor) => competitor.scoringComplete),
                competitors: sortedCompetitors,
            }
        })
        .sort(compareCombinedStandingsCategories)
}

function formatDayScoreLabel(dayScore: DayScoreStatus | undefined): string {
    if (dayScore?.kind === "scored") {
        return formatParticipantResultDisplay(dayScore.result)
    }
    if (dayScore?.kind === "pending") {
        return "—"
    }
    return ""
}

function formatCategoryStandingsGroup(
    category: CategoryStandings,
    days: ChampionshipDay[],
    showPlaces: boolean
): CategoryStandingsGroup {
    return {
        categoryKey: category.categoryKey,
        heading: showPlaces ? category.categoryLabel : `${category.categoryLabel} — in progress`,
        showPlaces,
        competitors: category.competitors.map((competitor, index) => ({
            membershipNo: competitor.membershipNo,
            competitorNumber: competitor.competitorNumber,
            name: competitor.name,
            club: competitor.club,
            place: showPlaces ? index + 1 : null,
            dayScoreLabels: days.map((day) => formatDayScoreLabel(competitor.scoresByDay[day.dayOrder])),
            totalLabel: formatStandingsTotal(competitor.combinedTotal),
        })),
    }
}

export function calculateChampionshipCombinedStandings(
    registrations: RegisteredCompetitor[],
    days: ChampionshipDay[],
    rounds: ChampionshipRoundRef[],
    scores: DayScoreInput[],
    enrollmentByMembership: Record<string, ChampionshipEnrollmentSlot[]>
): ChampionshipCombinedStandings | null {
    if (days.length === 0) {
        return null
    }

    const categories = groupStandingsByCategory(
        calculateCompetitorStandings(registrations, days, rounds, scores, enrollmentByMembership)
    )

    return {
        days: days.map((day) => ({ dayOrder: day.dayOrder, label: day.label })),
        inProgress: categories
            .filter((category) => !category.scoringComplete)
            .map((category) => formatCategoryStandingsGroup(category, days, false)),
        complete: categories
            .filter((category) => category.scoringComplete)
            .map((category) => formatCategoryStandingsGroup(category, days, true)),
        isEmpty: categories.length === 0,
    }
}
