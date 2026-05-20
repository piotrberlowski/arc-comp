import { auth } from "@/app/auth"
import {
    getChampionshipOrganizerClubs,
    hasChampionshipOrganizerAccess,
} from "@/lib/championshipOrganizerScope"

export async function resolveChampionshipOrganizerClubs(): Promise<string[] | null> {
    const session = await auth()
    if (!session || !hasChampionshipOrganizerAccess(session.organizerRoles)) {
        return null
    }

    const clubs = getChampionshipOrganizerClubs(session.organizerRoles)
    return clubs.length > 0 ? clubs : null
}

export async function assertChampionshipOrganizerClubs(): Promise<string[]> {
    const clubs = await resolveChampionshipOrganizerClubs()
    if (!clubs) {
        throw new Error("Unauthorized")
    }

    return clubs
}
