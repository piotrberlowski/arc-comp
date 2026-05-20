import type { Organizer } from "@/generated/prisma/client"
import {
    getChampionshipOrganizerClubs,
    hasChampionshipOrganizerAccess,
} from "../championshipOrganizerScope"

function role(club: string, canManageChampionships: boolean): Organizer {
    return { userId: "u1", club, canManageChampionships }
}

describe("championshipOrganizerScope", () => {
    it("hasChampionshipOrganizerAccess is false when no CO upgrade", () => {
        expect(hasChampionshipOrganizerAccess([role("ClubA", false)])).toBe(false)
    })

    it("hasChampionshipOrganizerAccess is true when any club has CO upgrade", () => {
        expect(
            hasChampionshipOrganizerAccess([role("ClubA", false), role("ClubB", true)])
        ).toBe(true)
    })

    it("getChampionshipOrganizerClubs returns only CO clubs", () => {
        expect(
            getChampionshipOrganizerClubs([role("ClubA", false), role("ClubB", true), role("ClubC", true)])
        ).toEqual(["ClubB", "ClubC"])
    })
})
