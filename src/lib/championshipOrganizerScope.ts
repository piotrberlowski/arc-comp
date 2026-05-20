import type { Organizer } from "@/generated/prisma/client"

export function hasChampionshipOrganizerAccess(roles: Organizer[]): boolean {
    return roles.some((role) => role.canManageChampionships)
}

export function getChampionshipOrganizerClubs(roles: Organizer[]): string[] {
    return roles.filter((role) => role.canManageChampionships).map((role) => role.club)
}
