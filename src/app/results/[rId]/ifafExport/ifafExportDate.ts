export function formatIfafExportDate(date: Date): string {
    return date.toISOString().split("T")[0]
}

export function formatIfafExportDateRange(dateStart: Date, dateEnd: Date): string {
    const start = formatIfafExportDate(dateStart)
    const end = formatIfafExportDate(dateEnd)

    if (start === end) {
        return start
    }

    return `${start} – ${end}`
}
