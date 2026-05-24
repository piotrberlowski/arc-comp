export const SCORE_DNF = -1
export const SCORE_DNC = -2

export type ResultStatus = 'COMPLETED' | 'DNF' | 'DNC'

export interface ParticipantResult {
    status: ResultStatus
    score: number | null
    shootoff: number | null
}

export function toResult(score: number): ParticipantResult {
    if (score === SCORE_DNF) {
        return { status: 'DNF', score: null, shootoff: null }
    }
    if (score === SCORE_DNC) {
        return { status: 'DNC', score: null, shootoff: null }
    }

    const intPart = Math.floor(score)
    const decimalPart = score - intPart
    const shootoff = decimalPart > 0 ? Math.round(decimalPart * 1000) : null

    return { status: 'COMPLETED', score: intPart, shootoff }
}

export function toScore(score: number, shootoff?: number): number {
    if (shootoff !== undefined && shootoff !== null) {
        return score + (shootoff / 1000)
    }
    return score
}

export function formatParticipantResultDisplay(result: ParticipantResult | null): string {
    if (!result) {
        return "-"
    }
    if (result.status === "DNF") {
        return "DNF"
    }
    if (result.status === "DNC") {
        return "DNC"
    }
    if (result.shootoff !== null) {
        return `${result.score} (${result.shootoff})`
    }
    return result.score?.toString() ?? "-"
}

export interface TiebreakerCandidate {
    participantId: string
    name: string
    category: string
    ageGender: string
    score: number
    shootoff: number | null
    groupKey: string
}

export interface TiebreakerGroup {
    groupKey: string
    category: string
    ageGender: string
    score: number
    participants: TiebreakerCandidate[]
    isResolved: boolean
}

export function findTiebreakers(
    participants: Array<{
        id: string
        name: string
        categoryId: string
        ageGroupId: string
        genderGroup: string
        result: ParticipantResult
    }>,
    medalPositions = 3
): TiebreakerGroup[] {
    const grouped = new Map<string, typeof participants>()

    for (const p of participants) {
        if (p.result.status !== 'COMPLETED') continue

        const key = `${p.categoryId}-${p.ageGroupId}-${p.genderGroup}`
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(p)
    }

    const tieGroups: TiebreakerGroup[] = []

    for (const [key, group] of grouped) {
        const sorted = [...group].sort((a, b) => {
            const aScore = a.result.score ?? 0
            const bScore = b.result.score ?? 0
            return bScore - aScore
        })

        const tiesByScore = new Map<number, typeof participants>()

        for (let i = 0; i < sorted.length && i < medalPositions + 1; i++) {
            const current = sorted[i]
            const currentScore = current.result.score!

            const tiedWith = sorted.filter((other, j) =>
                j !== i &&
                j <= medalPositions &&
                other.result.score === currentScore
            )

            if (tiedWith.length > 0) {
                if (!tiesByScore.has(currentScore)) {
                    tiesByScore.set(currentScore, [])
                }
                const existing = tiesByScore.get(currentScore)!
                if (!existing.find(p => p.id === current.id)) {
                    existing.push(current)
                }
            }
        }

        for (const [score, tiedParticipants] of tiesByScore) {
            const [categoryId, ageGroupId, genderGroup] = key.split('-')
            const groupKey = `${key}-${score}`
            
            const candidates: TiebreakerCandidate[] = tiedParticipants.map(p => ({
                participantId: p.id,
                name: p.name,
                category: categoryId,
                ageGender: `${ageGroupId}${genderGroup}`,
                score: p.result.score!,
                shootoff: p.result.shootoff,
                groupKey
            }))

            const allHaveShootoff = candidates.every(c => c.shootoff !== null)
            const shootoffs = candidates.map(c => c.shootoff).filter(s => s !== null)
            const allShootoffsUnique = new Set(shootoffs).size === shootoffs.length

            tieGroups.push({
                groupKey,
                category: categoryId,
                ageGender: `${ageGroupId}${genderGroup}`,
                score,
                participants: candidates,
                isResolved: allHaveShootoff && allShootoffsUnique
            })
        }
    }

    return tieGroups
}
