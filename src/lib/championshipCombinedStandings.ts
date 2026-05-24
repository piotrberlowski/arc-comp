import {
    formatParticipantResultDisplay,
    toResult,
    type ParticipantResult,
} from "@/lib/scoreUtils"

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
    categoryId: string
    genderGroup: string
    ageGroupName: string
    categoryName: string
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

type CompetitorStanding = {
    membershipNo: string
    competitorNumber: number
    name: string
    club: string
    ageGroupId: string
    categoryId: string
    genderGroup: string
    categoryKey: string
    categoryLabel: string
    scoresByDay: Record<number, DayScoreStatus>
    combinedTotal: number | null
    scoringComplete: boolean
}

type CategoryStandings = {
    categoryKey: string
    categoryLabel: string
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
    enrolledDayOrders: number[],
    dayOrder: number,
    rawScore: number | undefined
): DayScoreStatus {
    if (!enrolledDayOrders.includes(dayOrder)) {
        return { kind: "not_enrolled" }
    }
    if (rawScore === undefined) {
        return { kind: "pending" }
    }
    return { kind: "scored", rawScore, result: toResult(rawScore) }
}

function calculateCompetitorStandings(
    registrations: RegisteredCompetitor[],
    days: ChampionshipDay[],
    scores: DayScoreInput[],
    enrollmentByMembership: Record<string, number[]>
): CompetitorStanding[] {
    const tournamentDayOrder = new Map(days.map((day) => [day.tournamentId, day.dayOrder]))
    const scoresByMembershipDay = new Map<string, Map<number, number>>()

    for (const score of scores) {
        const dayOrder = tournamentDayOrder.get(score.tournamentId)
        if (dayOrder === undefined || score.rawScore === null) {
            continue
        }
        const byDay = scoresByMembershipDay.get(score.membershipNo) ?? new Map()
        byDay.set(dayOrder, score.rawScore)
        scoresByMembershipDay.set(score.membershipNo, byDay)
    }

    return registrations.map((registration) => {
        const enrolledDayOrders = enrollmentByMembership[registration.membershipNo] ?? []
        const scoresForMember = scoresByMembershipDay.get(registration.membershipNo)
        const scoresByDay: Record<number, DayScoreStatus> = {}

        for (const day of days) {
            scoresByDay[day.dayOrder] = resolveDayScoreStatus(
                enrolledDayOrders,
                day.dayOrder,
                scoresForMember?.get(day.dayOrder)
            )
        }

        const scoringComplete =
            enrolledDayOrders.length > 0 &&
            enrolledDayOrders.every((dayOrder) => scoresByDay[dayOrder]?.kind === "scored")

        return {
            membershipNo: registration.membershipNo,
            competitorNumber: registration.competitorNumber,
            name: registration.name,
            club: registration.club,
            ageGroupId: registration.ageGroupId,
            categoryId: registration.categoryId,
            genderGroup: registration.genderGroup,
            categoryKey: championshipCategoryKey(
                registration.ageGroupId,
                registration.genderGroup,
                registration.categoryId
            ),
            categoryLabel: `${registration.ageGroupName} ${registration.genderGroup} ${registration.categoryName}`,
            scoresByDay,
            combinedTotal: sumCompletedDayTotals(scoresByDay),
            scoringComplete,
        }
    })
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
                scoringComplete: sortedCompetitors.every((competitor) => competitor.scoringComplete),
                competitors: sortedCompetitors,
            }
        })
        .sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel))
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
    scores: DayScoreInput[],
    enrollmentByMembership: Record<string, number[]>
): ChampionshipCombinedStandings | null {
    if (days.length === 0) {
        return null
    }

    const categories = groupStandingsByCategory(
        calculateCompetitorStandings(registrations, days, scores, enrollmentByMembership)
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
