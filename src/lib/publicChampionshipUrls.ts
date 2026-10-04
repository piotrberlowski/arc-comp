export const PUBLIC_CHAMPIONSHIP_STANDINGS_TAB = "standings"

export type PublicChampionshipTab = number | typeof PUBLIC_CHAMPIONSHIP_STANDINGS_TAB

export function buildPublicChampionshipResultsPath(championshipId: string, tab?: PublicChampionshipTab): string {
    const base = `/results/championships/${championshipId}`
    if (tab === undefined) {
        return base
    }
    return `${base}?day=${tab}`
}

export function buildPublicChampionshipResultsUrl(
    origin: string,
    championshipId: string,
    tab?: PublicChampionshipTab
): string {
    return `${origin}${buildPublicChampionshipResultsPath(championshipId, tab)}`
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

export function parsePublicChampionshipTabQuery(value: string | undefined): PublicChampionshipTab | undefined {
    if (value === PUBLIC_CHAMPIONSHIP_STANDINGS_TAB) {
        return value
    }
    return parsePublicChampionshipDayQuery(value)
}
