import { prismaMock } from "@/test/prismaSingleton"
import { listPublishedTournaments } from "../resultsActions"

describe("listPublishedTournaments", () => {
    it("lists only standalone published tournaments", async () => {
        prismaMock.tournament.findMany.mockResolvedValue([])

        await listPublishedTournaments()

        expect(prismaMock.tournament.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    championshipRound: { is: null },
                    isPublished: true,
                }),
                include: { format: true },
                orderBy: { date: "desc" },
            })
        )
    })

    it("propagates database errors", async () => {
        prismaMock.tournament.findMany.mockRejectedValue(new Error("db unavailable"))

        await expect(listPublishedTournaments()).rejects.toThrow("db unavailable")
    })
})
