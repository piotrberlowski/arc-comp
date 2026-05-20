export function competitorsRegisteredLabel(registrationCount: number): string {
    return `${registrationCount} competitor${registrationCount === 1 ? "" : "s"} registered`
}
