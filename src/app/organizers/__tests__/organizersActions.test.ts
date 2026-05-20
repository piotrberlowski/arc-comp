import { prismaMock } from "@/test/prismaSingleton"
import { setChampionshipOrganizerPowerUp } from "../organizersActions"

describe("setChampionshipOrganizerPowerUp", () => {
    it("updates canManageChampionships on existing organizer row", async () => {
        prismaMock.organizer.update.mockResolvedValue({
            userId: "u1",
            club: "ClubA",
            canManageChampionships: true,
        } as never)

        await setChampionshipOrganizerPowerUp("u1", "ClubA", true)

        expect(prismaMock.organizer.update).toHaveBeenCalledWith({
            where: {
                userId_club: { userId: "u1", club: "ClubA" },
            },
            data: { canManageChampionships: true },
        })
    })
})
