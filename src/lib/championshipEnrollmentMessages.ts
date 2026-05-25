export type EnrollChampionshipDayResult = {
    enrolledCount: number
    skippedCount: number
}

export function formatDayEnrollAllMessage(result: EnrollChampionshipDayResult, dayOrder: number): string | undefined {
    if (result.skippedCount === 0) {
        return undefined
    }

    return `Enrolled ${result.enrolledCount} on day ${dayOrder}. Skipped ${result.skippedCount} without a range assignment for this day.`
}

export function formatEnrollAllDaysMessage(result: EnrollChampionshipDayResult): string | undefined {
    if (result.skippedCount === 0) {
        return undefined
    }

    return `Enrolled ${result.enrolledCount} across all days. Skipped ${result.skippedCount} without a range assignment on at least one day.`
}
