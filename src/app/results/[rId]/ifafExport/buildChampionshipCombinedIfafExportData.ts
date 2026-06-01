import { buildEnrollmentByMembership, type ChampionshipEnrollmentSlot } from "@/lib/championshipEnrollment"
import {
    buildCompetitorStandingsByCategoryFromChampionshipData,
    mapChampionshipRegistrationsToStandings,
    type ChampionshipStandingsRegistrationSource,
} from "@/lib/championshipStandingsInput"
import {
    flattenSortedCompetitorStandings,
    type ChampionshipRoundRef,
    type CompetitorStanding,
    type DayScoreInput,
} from "@/lib/championshipCombinedStandings"
import {
    formatIfafScoreCell,
    scoresByTournamentForMember,
    sumCompletedScoresForRange,
} from "@/lib/championshipCombinedIfafScores"
import type { IfafExportData, IfafExportParticipant } from "./ifafExportTypes"

function mapCompetitorToIfafParticipant(
    competitor: CompetitorStanding,
    rounds: ChampionshipRoundRef[],
    rangeCount: number,
    enrollmentByMembership: Record<string, ChampionshipEnrollmentSlot[]>,
    scores: DayScoreInput[]
): IfafExportParticipant {
    const enrolledSlots = enrollmentByMembership[competitor.membershipNo] ?? []
    const scoresByTournament = scoresByTournamentForMember(scores, competitor.membershipNo)
    const rangeScores = Array.from({ length: rangeCount }, (_, index) =>
        formatIfafScoreCell(
            sumCompletedScoresForRange(enrolledSlots, rounds, index + 1, scoresByTournament)
        )
    )

    return {
        name: competitor.name,
        membershipNo: competitor.membershipNo,
        club: competitor.club,
        ageGroupId: competitor.ageGroupId,
        categoryId: competitor.categoryId,
        genderGroup: competitor.genderGroup,
        scoreColumns: [...rangeScores, formatIfafScoreCell(competitor.combinedTotal)],
    }
}

export function buildChampionshipCombinedIfafExportData({
    organizerClub,
    rangeFormatNames,
    rangeFormatShortNames,
    rangeCount,
    dateStart,
    dateEnd,
    registrations,
    rounds,
    scores,
    enrollmentByTournament,
    championshipName,
}: {
    championshipName: string
    organizerClub: string
    rangeFormatNames: string[]
    rangeFormatShortNames: string[]
    rangeCount: number
    dateStart: Date
    dateEnd: Date
    registrations: ChampionshipStandingsRegistrationSource[]
    rounds: ChampionshipRoundRef[]
    scores: DayScoreInput[]
    enrollmentByTournament: Record<string, string[]>
}): IfafExportData | null {
    if (rangeCount < 2 || rangeCount > 5 || rounds.length === 0) {
        return null
    }

    const enrollmentByMembership = buildEnrollmentByMembership(rounds, enrollmentByTournament)
    const byCategory = buildCompetitorStandingsByCategoryFromChampionshipData({
        registrations,
        rounds,
        scores,
        enrollmentByTournament,
    })
    const standings = flattenSortedCompetitorStandings(byCategory)
    const mappedRegistrations = mapChampionshipRegistrationsToStandings(registrations)

    const participants = standings.map((competitor) =>
        mapCompetitorToIfafParticipant(competitor, rounds, rangeCount, enrollmentByMembership, scores)
    )

    return {
        organizerClub,
        roundLabel: rangeFormatNames.join(", "),
        scoreColumnHeaders: [...rangeFormatShortNames, "total"],
        participantCount: mappedRegistrations.length,
        dateStart,
        dateEnd,
        fileNameStem: championshipName,
        participants,
    }
}
