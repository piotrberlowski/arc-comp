import { mockInteractiveTransaction, prismaMock } from "../prismaSingleton"

describe("prisma test helpers", () => {
    it("executes interactive transaction callbacks with mock client", async () => {
        mockInteractiveTransaction()
        prismaMock.tournament.count.mockResolvedValue(7)

        const value = await prismaMock.$transaction(async (tx) => tx.tournament.count())

        expect(value).toBe(7)
    })
})
