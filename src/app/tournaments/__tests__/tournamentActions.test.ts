import { prismaMock } from "@/test/prismaSingleton"
import { listTournamentsForClubs } from "../tournamentActions"

describe("listTournamentsForClubs", () => {
    it("queries standalone tournaments for the given clubs and archive flag", async () => {
        prismaMock.tournament.findMany.mockResolvedValue([])

        await listTournamentsForClubs(["ClubA", "ClubB"], false)

        expect(prismaMock.tournament.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    championshipRound: { is: null },
                    organizerClub: { in: ["ClubA", "ClubB"] },
                    isArchive: false,
                }),
                include: { format: true },
                orderBy: { date: "desc" },
            })
        )
    })

    it("omits archive filter when includeArchive is true", async () => {
        prismaMock.tournament.findMany.mockResolvedValue([])

        await listTournamentsForClubs(["ClubA"], true)

        expect(prismaMock.tournament.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    championshipRound: { is: null },
                }),
            })
        )
        expect(prismaMock.tournament.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.not.objectContaining({
                    isArchive: expect.anything(),
                }),
            })
        )
    })

    it("propagates lookup failures", async () => {
        prismaMock.tournament.findMany.mockRejectedValue(new Error("database timeout"))

        await expect(listTournamentsForClubs(["ClubA"], false)).rejects.toThrow("database timeout")
    })
})
