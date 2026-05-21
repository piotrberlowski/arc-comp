export function championshipDayTournamentName(championshipName: string, dayOrder: number): string {
    return `${championshipName} — Day ${dayOrder}`
}

export function nextChampionshipDayOrder(rounds: { dayOrder: number }[]): number {
    if (rounds.length === 0) {
        return 1
    }
    return Math.max(...rounds.map((round) => round.dayOrder)) + 1
}
