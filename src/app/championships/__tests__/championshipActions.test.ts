import { prismaMock } from "@/test/prismaSingleton"
import {
    addChampionshipDay,
    addRoundTournament,
    createChampionship,
    getChampionshipForOrganizer,
    listChampionshipDayTournamentsForClubs,
    registerChampionshipParticipant,
    removeChampionshipDay,
    updateChampionship,
} from "../championshipActions"

jest.mock("@/lib/championshipOrganizerSession", () => ({
    assertChampionshipOrganizerClubs: jest.fn().mockResolvedValue(["ClubA"]),
    resolveChampionshipOrganizerClubs: jest.fn().mockResolvedValue(["ClubA"]),
}))

describe("createChampionship", () => {
    it("creates championship for authorized club", async () => {
        prismaMock.championship.create.mockResolvedValue({ id: "champ-new" } as never)

        await expect(
            createChampionship({ name: "Spring Series", organizerClub: "ClubA" })
        ).resolves.toEqual({ id: "champ-new" })

        expect(prismaMock.championship.create).toHaveBeenCalledWith({
            data: { name: "Spring Series", organizerClub: "ClubA" },
        })
    })

    it("throws when club is not in CO scope", async () => {
        await expect(
            createChampionship({ name: "Spring Series", organizerClub: "ClubB" })
        ).rejects.toThrow("Unauthorized")
        expect(prismaMock.championship.create).not.toHaveBeenCalled()
    })

    it("throws generic message when create fails", async () => {
        prismaMock.championship.create.mockRejectedValue(new Error("db down"))

        await expect(
            createChampionship({ name: "Spring Series", organizerClub: "ClubA" })
        ).rejects.toThrow("Unable to create championship")
    })
})

describe("updateChampionship", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({ id: "champ-1" } as never)
        prismaMock.$transaction.mockImplementation((callback) =>
            typeof callback === "function" ? callback(prismaMock) : Promise.resolve(callback)
        )
        prismaMock.championshipRound.findMany.mockResolvedValue([
            { dayOrder: 1, tournamentId: "tour-1" },
            { dayOrder: 2, tournamentId: "tour-2" },
        ] as never)
    })

    it("updates championship name and renames linked day tournaments", async () => {
        prismaMock.championship.update.mockResolvedValue({ id: "champ-1", name: "Renamed" } as never)

        await expect(updateChampionship("champ-1", { name: "Renamed" })).resolves.toEqual({
            id: "champ-1",
            name: "Renamed",
        })

        expect(prismaMock.championship.update).toHaveBeenCalledWith({
            where: { id: "champ-1" },
            data: { name: "Renamed" },
        })
        expect(prismaMock.tournament.update).toHaveBeenCalledWith({
            where: { id: "tour-1" },
            data: { name: "Renamed — Day 1" },
        })
        expect(prismaMock.tournament.update).toHaveBeenCalledWith({
            where: { id: "tour-2" },
            data: { name: "Renamed — Day 2" },
        })
    })

    it("throws when championship is not in organizer scope", async () => {
        prismaMock.championship.findFirst.mockResolvedValue(null)

        await expect(updateChampionship("champ-1", { name: "Renamed" })).rejects.toThrow("Unauthorized")
        expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it("throws generic message when update fails", async () => {
        prismaMock.$transaction.mockRejectedValue(new Error("db down"))

        await expect(updateChampionship("champ-1", { name: "Renamed" })).rejects.toThrow(
            "Unable to update championship"
        )
    })
})

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
                    include: {
                        tournament: {
                            include: {
                                format: true,
                                _count: {
                                    select: { participantScores: true },
                                },
                            },
                        },
                    },
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

describe("addChampionshipDay", () => {
    const dayInput = {
        championshipId: "champ-1",
        formatId: "fmt-1",
        date: new Date("2026-06-02"),
        endCount: 28,
        groupSize: 4,
    }

    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({
            id: "champ-1",
            name: "Spring Series",
            organizerClub: "ClubA",
            rounds: [{ dayOrder: 1 }],
        } as never)
        prismaMock.$transaction.mockImplementation((callback) =>
            typeof callback === "function" ? callback(prismaMock) : Promise.resolve(callback)
        )
        prismaMock.tournament.create.mockResolvedValue({ id: "tour-2" } as never)
        prismaMock.championshipRound.create.mockResolvedValue({ id: "round-2", dayOrder: 2 } as never)
    })

    it("creates tournament and links next day order", async () => {
        await expect(addChampionshipDay(dayInput)).resolves.toEqual({ id: "round-2", dayOrder: 2 })

        expect(prismaMock.tournament.create).toHaveBeenCalledWith({
            data: {
                name: "Spring Series — Day 2",
                organizerClub: "ClubA",
                formatId: "fmt-1",
                date: dayInput.date,
                endCount: 28,
                groupSize: 4,
            },
        })
        expect(prismaMock.championshipRound.create).toHaveBeenCalledWith({
            data: {
                championshipId: "champ-1",
                dayOrder: 2,
                tournamentId: "tour-2",
            },
            include: { tournament: true },
        })
    })

    it("starts at day 1 when no rounds exist", async () => {
        prismaMock.championship.findFirst.mockResolvedValue({
            id: "champ-1",
            name: "Spring Series",
            organizerClub: "ClubA",
            rounds: [],
        } as never)

        await addChampionshipDay(dayInput)

        expect(prismaMock.tournament.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                name: "Spring Series — Day 1",
            }),
        })
        expect(prismaMock.championshipRound.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ dayOrder: 1 }),
            })
        )
    })

    it("throws when championship is not in organizer scope", async () => {
        prismaMock.championship.findFirst.mockResolvedValue(null)

        await expect(addChampionshipDay(dayInput)).rejects.toThrow("Unauthorized")
        expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })
})

describe("removeChampionshipDay", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({
            id: "champ-1",
            rounds: [
                {
                    dayOrder: 1,
                    tournamentId: "tour-1",
                    tournament: { _count: { participantScores: 0 } },
                },
            ],
        } as never)
        prismaMock.$transaction.mockImplementation((callback) =>
            typeof callback === "function" ? callback(prismaMock) : Promise.resolve(callback)
        )
    })

    it("removes participants, round, and tournament when no scores", async () => {
        await expect(removeChampionshipDay("champ-1", 1)).resolves.toBeUndefined()

        expect(prismaMock.participant.deleteMany).toHaveBeenCalledWith({
            where: { tournamentId: "tour-1" },
        })
        expect(prismaMock.championshipRound.delete).toHaveBeenCalledWith({
            where: {
                championshipId_dayOrder: {
                    championshipId: "champ-1",
                    dayOrder: 1,
                },
            },
        })
        expect(prismaMock.tournament.delete).toHaveBeenCalledWith({
            where: { id: "tour-1" },
        })
    })

    it("throws when scores exist on the day tournament", async () => {
        prismaMock.championship.findFirst.mockResolvedValue({
            id: "champ-1",
            rounds: [
                {
                    dayOrder: 1,
                    tournamentId: "tour-1",
                    tournament: { _count: { participantScores: 2 } },
                },
            ],
        } as never)

        await expect(removeChampionshipDay("champ-1", 1)).rejects.toThrow(
            "Cannot remove a day after scores have been entered"
        )
        expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it("throws when day order is not found", async () => {
        await expect(removeChampionshipDay("champ-1", 9)).rejects.toThrow("Championship day not found")
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
