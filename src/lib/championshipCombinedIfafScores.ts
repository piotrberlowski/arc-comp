import type { ChampionshipRoundRef, DayScoreInput } from "@/lib/championshipCombinedStandings"
import type { ChampionshipEnrollmentSlot } from "@/lib/championshipEnrollment"
import { toResult, type ParticipantResult } from "@/lib/scoreUtils"

function completedScoreContribution(rawScore: number): number | null {
    const result = toResult(rawScore)
    if (result.status !== "COMPLETED") {
        return null
    }
    return rawScore
}

export function sumCompletedScoresForRange(
    enrolledSlots: ChampionshipEnrollmentSlot[],
    rounds: ChampionshipRoundRef[],
    rangeNumber: number,
    scoresByTournament: Map<string, number>
): number | null {
    let total = 0
    let hasContribution = false

    for (const round of rounds) {
        if (round.rangeNumber !== rangeNumber) {
            continue
        }
        const enrolledOnRound = enrolledSlots.some(
            (slot) => slot.dayOrder === round.dayOrder && slot.rangeNumber === round.rangeNumber
        )
        if (!enrolledOnRound) {
            continue
        }
        const rawScore = scoresByTournament.get(round.tournamentId)
        if (rawScore === undefined) {
            continue
        }
        const contribution = completedScoreContribution(rawScore)
        if (contribution === null) {
            continue
        }
        total += contribution
        hasContribution = true
    }

    return hasContribution ? total : null
}

export function formatIfafScoreFromResult(result: ParticipantResult): string {
    if (result.status === "COMPLETED") {
        return result.score?.toString() ?? ""
    }

    return result.status
}

export function formatIfafScoreCell(rawTotal: number | null): string {
    if (rawTotal === null) {
        return ""
    }

    return formatIfafScoreFromResult(toResult(rawTotal))
}

export function scoresByTournamentForMember(scores: DayScoreInput[], membershipNo: string): Map<string, number> {
    const byTournament = new Map<string, number>()
    for (const score of scores) {
        if (score.membershipNo !== membershipNo || score.rawScore === null) {
            continue
        }
        byTournament.set(score.tournamentId, score.rawScore)
    }
    return byTournament
}
