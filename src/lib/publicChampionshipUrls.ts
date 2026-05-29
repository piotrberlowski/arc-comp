export function buildPublicChampionshipResultsPath(championshipId: string, dayOrder?: number): string {
    const base = `/results/championships/${championshipId}`
    if (dayOrder === undefined) {
        return base
    }
    return `${base}?day=${dayOrder}`
}

export function buildPublicChampionshipResultsUrl(origin: string, championshipId: string, dayOrder?: number): string {
    return `${origin}${buildPublicChampionshipResultsPath(championshipId, dayOrder)}`
}

export function buildPublicChampionshipPrintPath(championshipId: string, dayOrder: number): string {
    return `/results/championships/${championshipId}/print/${dayOrder}`
}

export function parsePublicChampionshipDayQuery(day: string | undefined): number | undefined {
    if (!day) {
        return undefined
    }
    const parsed = Number.parseInt(day, 10)
    if (!Number.isFinite(parsed) || parsed < 1) {
        return undefined
    }
    return parsed
}
