/** Tailwind grid column classes for a responsive group card layout. */
export function groupGridColsClassName(groupCount: number): string {
    if (groupCount <= 4) {
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    }
    if (groupCount <= 6) {
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    }
    if (groupCount <= 9) {
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    }
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
}
