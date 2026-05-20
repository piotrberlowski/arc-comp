import { prismaMock } from "@/test/prismaSingleton"
import {
    addRoundTournament,
    getChampionshipForOrganizer,
    listChampionshipDayTournamentsForClubs,
    registerChampionshipParticipant,
} from "../championshipActions"

jest.mock("@/lib/championshipOrganizerSession", () => ({
    assertChampionshipOrganizerClubs: jest.fn().mockResolvedValue(["ClubA"]),
    resolveChampionshipOrganizerClubs: jest.fn().mockResolvedValue(["ClubA"]),
}))

describe("getChampionshipForOrganizer", () => {
    it("returns null when organizer club list is empty", async () => {
        await expect(getChampionshipForOrganizer("champ-1", [])).resolves.toBeNull()
        expect(prismaMock.championship.findFirst).not.toHaveBeenCalled()
    })

    it("loads championship scoped to organizer clubs", async () => {
        prismaMock.championship.findFirst.mockResolvedValue({ id: "champ-1" } as never)

        await getChampionshipForOrganizer("champ-1", ["ClubA"])

        expect(prismaMock.championship.findFirst).toHaveBeenCalledWith({
            where: {
                id: "champ-1",
                organizerClub: { in: ["ClubA"] },
            },
            include: expect.objectContaining({
                rounds: {
                    include: { tournament: true },
                    orderBy: { dayOrder: "asc" },
                },
                _count: {
                    select: { registrations: true },
                },
            }),
        })
    })

    it("returns null when championship lookup fails", async () => {
        prismaMock.championship.findFirst.mockRejectedValue(new Error("db down"))

        await expect(getChampionshipForOrganizer("champ-1", ["ClubA"])).resolves.toBeNull()
    })
})

describe("listChampionshipDayTournaments", () => {
    it("loads rounds with tournaments ordered by day for authorized clubs", async () => {
        prismaMock.championshipRound.findMany.mockResolvedValue([])

        await listChampionshipDayTournamentsForClubs("champ-1", ["ClubA"])

        expect(prismaMock.championshipRound.findMany).toHaveBeenCalledWith({
            where: {
                championshipId: "champ-1",
                championship: {
                    organizerClub: { in: ["ClubA"] },
                },
            },
            include: {
                tournament: {
                    include: { format: true },
                },
            },
            orderBy: { dayOrder: "asc" },
        })
    })

    it("returns null when round lookup fails", async () => {
        prismaMock.championshipRound.findMany.mockRejectedValue(new Error("db down"))

        await expect(listChampionshipDayTournamentsForClubs("champ-1", ["ClubA"])).resolves.toBeNull()
    })
})

describe("addRoundTournament", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({ id: "champ-1" } as never)
    })

    it("throws a specific error for duplicate day order", async () => {
        prismaMock.championshipRound.create.mockRejectedValue({
            code: "P2002",
            meta: { target: ["championshipId", "dayOrder"] },
        })

        await expect(
            addRoundTournament({
                championshipId: "champ-1",
                dayOrder: 2,
                tournamentId: "tour-1",
            })
        ).rejects.toThrow("This championship day order already exists")
    })

    it("throws a specific error when tournament already belongs to a round", async () => {
        prismaMock.championshipRound.create.mockRejectedValue({
            code: "P2002",
            meta: { target: ["tournamentId"] },
        })

        await expect(
            addRoundTournament({
                championshipId: "champ-1",
                dayOrder: 2,
                tournamentId: "tour-1",
            })
        ).rejects.toThrow("Tournament is already attached to a championship round")
    })

    it("throws generic message for unknown create failures", async () => {
        prismaMock.championshipRound.create.mockRejectedValue(new Error("unexpected"))

        await expect(
            addRoundTournament({
                championshipId: "champ-1",
                dayOrder: 2,
                tournamentId: "tour-1",
            })
        ).rejects.toThrow("Unable to add championship round")
    })
})

describe("registerChampionshipParticipant", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({ id: "champ-1" } as never)
    })

    it("retries on competitor number collisions and succeeds", async () => {
        prismaMock.$transaction
            .mockRejectedValueOnce({
                code: "P2002",
                meta: { target: ["championshipId", "competitorNumber"] },
            })
            .mockResolvedValueOnce({ id: "reg-1" })

        await expect(
            registerChampionshipParticipant({
                championshipId: "champ-1",
                membershipNo: "M-001",
            })
        ).resolves.toEqual({ id: "reg-1" })
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(2)
    })

    it("throws a specific duplicate membership error", async () => {
        prismaMock.$transaction.mockRejectedValue({
            code: "P2002",
            meta: { target: ["championshipId", "membershipNo"] },
        })

        await expect(
            registerChampionshipParticipant({
                championshipId: "champ-1",
                membershipNo: "M-001",
            })
        ).rejects.toThrow("This membership number is already registered in this championship")
    })

    it("rethrows non-unique transaction failures", async () => {
        prismaMock.$transaction.mockRejectedValue(new Error("network"))

        await expect(
            registerChampionshipParticipant({
                championshipId: "champ-1",
                membershipNo: "M-001",
            })
        ).rejects.toThrow("network")
    })
})
