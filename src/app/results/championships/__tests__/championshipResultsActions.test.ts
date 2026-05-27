import { prismaMock } from "@/test/prismaSingleton"
import { listPublicChampionships } from "../championshipResultsActions"

describe("listPublicChampionships", () => {
    it("lists championships with at least one published day tournament", async () => {
        prismaMock.championship.findMany.mockResolvedValue([
            {
                id: "champ-1",
                name: "Spring Series",
                organizerClub: "ClubA",
                rounds: [
                    {
                        dayOrder: 1,
                        tournament: { date: new Date("2026-05-01"), isPublished: true },
                    },
                    {
                        dayOrder: 2,
                        tournament: { date: new Date("2026-05-02"), isPublished: false },
                    },
                ],
            },
        ] as never)

        await expect(listPublicChampionships()).resolves.toEqual([
            {
                id: "champ-1",
                name: "Spring Series",
                organizerClub: "ClubA",
                dayCount: 1,
                firstDate: new Date("2026-05-01"),
                lastDate: new Date("2026-05-01"),
            },
        ])

        expect(prismaMock.championship.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    rounds: {
                        some: {
                            tournament: { isPublished: true },
                        },
                    },
                },
            })
        )
    })

    it("propagates database errors", async () => {
        prismaMock.championship.findMany.mockRejectedValue(new Error("db unavailable"))

        await expect(listPublicChampionships()).rejects.toThrow("db unavailable")
    })
})
