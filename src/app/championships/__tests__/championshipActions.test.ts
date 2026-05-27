import { prismaMock } from "@/test/prismaSingleton"
import {
    addChampionshipDay,
    addRoundTournament,
    archiveChampionship,
    createChampionship,
    enrollChampionshipCompetitorsOnDay,
    getChampionshipForOrganizer,
    getChampionshipSharingStatus,
    listChampionshipDayEnrollmentByTournament,
    listChampionshipDayTournamentsForClubs,
    listChampionshipEnrolledMembershipNos,
    listMyChampionshipsForClubs,
    registerChampionshipParticipant,
    removeChampionshipDay,
    removeChampionshipRegistration,
    unarchiveChampionship,
    unenrollChampionshipCompetitorFromDay,
    updateChampionship,
    updateChampionshipRegistration,
    updateChampionshipSharingSettings,
} from "../championshipActions"

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}))

jest.mock("@/lib/championshipOrganizerSession", () => ({
    assertChampionshipOrganizerClubs: jest.fn().mockResolvedValue(["ClubA"]),
    resolveChampionshipOrganizerClubs: jest.fn().mockResolvedValue(["ClubA"]),
}))

describe("createChampionship", () => {
    it("creates championship for authorized club", async () => {
        prismaMock.championship.create.mockResolvedValue({ id: "champ-new" } as never)

        prismaMock.$transaction.mockImplementation((callback) =>
            typeof callback === "function" ? callback(prismaMock) : Promise.resolve(callback)
        )
        prismaMock.championshipRange.create.mockResolvedValue({ id: "range-1" } as never)

        await expect(
            createChampionship({
                name: "Spring Series",
                organizerClub: "ClubA",
                rangeFormats: [{ rangeNumber: 1, formatId: "fmt-1" }],
            })
        ).resolves.toEqual({ id: "champ-new" })

        expect(prismaMock.championship.create).toHaveBeenCalledWith({
            data: { name: "Spring Series", organizerClub: "ClubA", rangeCount: 1 },
        })
        expect(prismaMock.championshipRange.create).toHaveBeenCalledWith({
            data: {
                championshipId: "champ-new",
                rangeNumber: 1,
                formatId: "fmt-1",
            },
        })
    })

    it("throws when club is not in CO scope", async () => {
        await expect(
            createChampionship({
                name: "Spring Series",
                organizerClub: "ClubB",
                rangeFormats: [{ rangeNumber: 1, formatId: "fmt-1" }],
            })
        ).rejects.toThrow("Unauthorized")
        expect(prismaMock.championship.create).not.toHaveBeenCalled()
    })

    it("throws generic message when create fails", async () => {
        prismaMock.$transaction.mockRejectedValue(new Error("db down"))

        await expect(
            createChampionship({
                name: "Spring Series",
                organizerClub: "ClubA",
                rangeFormats: [{ rangeNumber: 1, formatId: "fmt-1" }],
            })
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
            { dayOrder: 1, rangeNumber: 1, tournamentId: "tour-1" },
            { dayOrder: 2, rangeNumber: 1, tournamentId: "tour-2" },
        ] as never)
        prismaMock.championship.findUnique.mockResolvedValue({ rangeCount: 1 } as never)
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
                    orderBy: [{ dayOrder: "asc" }, { rangeNumber: "asc" }],
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
        name: "Spring Series — Day 2",
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
            rangeCount: 1,
            rangeConfigs: [
                {
                    rangeNumber: 1,
                    formatId: "fmt-1",
                    format: { endCount: 28, groupSize: 4 },
                },
            ],
            rounds: [{ dayOrder: 1, rangeNumber: 1 }],
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
            data: expect.objectContaining({
                name: "Spring Series — Day 2",
                organizerClub: "ClubA",
                formatId: "fmt-1",
                date: dayInput.date,
                endCount: 28,
                groupSize: 4,
            }),
        })
        expect(prismaMock.championshipRound.create).toHaveBeenCalledWith({
            data: {
                championshipId: "champ-1",
                dayOrder: 2,
                rangeNumber: 1,
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
            rangeCount: 1,
            rangeConfigs: [],
            rounds: [],
        } as never)

        await addChampionshipDay({
            ...dayInput,
            name: "Spring Series — Day 1",
        })

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
                    rangeNumber: 1,
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
            where: { tournamentId: { in: ["tour-1"] } },
        })
        expect(prismaMock.championshipRound.deleteMany).toHaveBeenCalledWith({
            where: { championshipId: "champ-1", dayOrder: 1 },
        })
        expect(prismaMock.championshipDivisionRange.deleteMany).toHaveBeenCalledWith({
            where: { championshipId: "champ-1", dayOrder: 1 },
        })
        expect(prismaMock.tournament.deleteMany).toHaveBeenCalledWith({
            where: { id: { in: ["tour-1"] } },
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

const registrationInput = {
    championshipId: "champ-1",
    name: "Alex Archer",
    membershipNo: "M-001",
    ageGroupId: "age-1",
    categoryId: "cat-1",
    club: "Club A",
    genderGroup: "M" as const,
}

describe("registerChampionshipParticipant", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({ id: "champ-1", isArchive: false, rounds: [], registrations: [] } as never)
        prismaMock.championshipRegistration.aggregate.mockResolvedValue({
            _max: { competitorNumber: 0 },
        } as never)
        prismaMock.championshipRegistration.create.mockResolvedValue({ id: "reg-1" } as never)
    })

    it("retries on competitor number collisions and succeeds", async () => {
        prismaMock.$transaction
            .mockRejectedValueOnce({
                code: "P2002",
                meta: { target: ["championshipId", "competitorNumber"] },
            })
            .mockImplementationOnce((callback) =>
                typeof callback === "function" ? callback(prismaMock) : Promise.resolve({ id: "reg-1" })
            )

        await expect(registerChampionshipParticipant(registrationInput)).resolves.toEqual({ id: "reg-1" })
        expect(prismaMock.championshipRegistration.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                championshipId: "champ-1",
                membershipNo: "M-001",
                name: "Alex Archer",
                competitorNumber: 1,
            }),
        })
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(2)
    })

    it("throws a specific duplicate membership error", async () => {
        prismaMock.$transaction.mockRejectedValue({
            code: "P2002",
            meta: { target: ["championshipId", "membershipNo"] },
        })

        await expect(registerChampionshipParticipant(registrationInput)).rejects.toThrow(
            "This membership number is already registered in this championship"
        )
    })

    it("rethrows non-unique transaction failures", async () => {
        prismaMock.$transaction.mockRejectedValue(new Error("network"))

        await expect(registerChampionshipParticipant(registrationInput)).rejects.toThrow("network")
    })
})

describe("listChampionshipDayEnrollmentByTournament", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({
            id: "champ-1",
            rounds: [
                { tournamentId: "tour-1" },
                { tournamentId: "tour-2" },
            ],
        } as never)
    })

    it("groups enrolled membership numbers by tournament", async () => {
        prismaMock.participant.findMany.mockResolvedValue([
            { membershipNo: "M-001", tournamentId: "tour-1" },
            { membershipNo: "M-002", tournamentId: "tour-2" },
        ] as never)

        await expect(listChampionshipDayEnrollmentByTournament("champ-1", ["ClubA"])).resolves.toEqual({
            "tour-1": ["M-001"],
            "tour-2": ["M-002"],
        })
    })

    it("returns null when championship is not in scope", async () => {
        prismaMock.championship.findFirst.mockResolvedValue(null)

        await expect(listChampionshipDayEnrollmentByTournament("champ-1", ["ClubA"])).resolves.toBeNull()
    })
})

describe("listChampionshipEnrolledMembershipNos", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({
            id: "champ-1",
            rounds: [{ tournamentId: "tour-1" }],
        } as never)
    })

    it("returns distinct membership numbers enrolled on championship days", async () => {
        prismaMock.participant.findMany.mockResolvedValue([
            { membershipNo: "M-001", tournamentId: "tour-1" },
            { membershipNo: "M-002", tournamentId: "tour-1" },
        ] as never)

        await expect(listChampionshipEnrolledMembershipNos("champ-1", ["ClubA"])).resolves.toEqual([
            "M-001",
            "M-002",
        ])
    })

    it("returns null when championship is not in scope", async () => {
        prismaMock.championship.findFirst.mockResolvedValue(null)

        await expect(listChampionshipEnrolledMembershipNos("champ-1", ["ClubA"])).resolves.toBeNull()
        expect(prismaMock.participant.findMany).not.toHaveBeenCalled()
    })
})

const writableChampionshipShell = {
    id: "champ-1",
    isArchive: false,
    rangeCount: 1,
    rangeConfigs: [
        {
            rangeNumber: 1,
            formatId: "fmt-1",
            format: { endCount: 28, groupSize: 4 },
        },
    ],
    rounds: [{ dayOrder: 1, rangeNumber: 1, tournamentId: "tour-1" }],
    divisionRanges: [],
    registrations: [
        {
            membershipNo: "M-001",
            name: "Alex Archer",
            competitorNumber: 1,
            ageGroupId: "age-1",
            categoryId: "cat-1",
            club: "Club A",
            genderGroup: "M",
        },
        {
            membershipNo: "M-002",
            name: "Blake Bow",
            competitorNumber: 2,
            ageGroupId: "age-1",
            categoryId: "cat-1",
            club: "Club B",
            genderGroup: "F",
        },
    ],
}

describe("enrollChampionshipCompetitorsOnDay", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue(writableChampionshipShell as never)
        prismaMock.$transaction.mockImplementation((callback) =>
            typeof callback === "function" ? callback(prismaMock) : Promise.resolve(callback)
        )
        prismaMock.participant.upsert.mockResolvedValue({ id: "part-1" } as never)
    })

    it("upserts participants copied from registrations", async () => {
        await expect(
            enrollChampionshipCompetitorsOnDay("champ-1", 1, ["M-001", "M-002"])
        ).resolves.toEqual({ enrolledCount: 2, skippedCount: 0 })

        expect(prismaMock.participant.upsert).toHaveBeenNthCalledWith(1, {
            where: {
                tournamentId_membershipNo: {
                    tournamentId: "tour-1",
                    membershipNo: "M-001",
                },
            },
            create: expect.objectContaining({
                tournamentId: "tour-1",
                membershipNo: "M-001",
                competitorNumber: 1,
                checkedIn: false,
            }),
            update: expect.objectContaining({
                name: "Alex Archer",
                competitorNumber: 1,
            }),
        })
        expect(prismaMock.participant.upsert).toHaveBeenCalledTimes(2)
    })

    it("throws when membership number is not registered", async () => {
        await expect(enrollChampionshipCompetitorsOnDay("champ-1", 1, ["M-999"])).rejects.toThrow(
            "Not registered in championship: M-999"
        )
        expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it("returns zero when no membership numbers are provided", async () => {
        await expect(enrollChampionshipCompetitorsOnDay("champ-1", 1, [])).resolves.toEqual({
            enrolledCount: 0,
            skippedCount: 0,
        })
        expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it("rejects enrollment when the division has no range assignment on a multi-range day", async () => {
        prismaMock.championship.findFirst.mockResolvedValue({
            ...writableChampionshipShell,
            rangeCount: 2,
            divisionRanges: [],
        } as never)

        await expect(enrollChampionshipCompetitorsOnDay("champ-1", 1, ["M-001"])).rejects.toThrow(
            "No competitors have a range assignment for this day"
        )
        expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it("loads prior range enrollments in one query when enrolling on day 2", async () => {
        prismaMock.championship.findFirst.mockResolvedValue({
            ...writableChampionshipShell,
            rangeCount: 2,
            divisionRanges: [
                {
                    dayOrder: 2,
                    ageGroupId: "age-1",
                    categoryId: "cat-1",
                    genderGroup: "M",
                    rangeNumber: 2,
                },
                {
                    dayOrder: 2,
                    ageGroupId: "age-1",
                    categoryId: "cat-1",
                    genderGroup: "F",
                    rangeNumber: 2,
                },
            ],
            rounds: [
                { dayOrder: 1, rangeNumber: 1, tournamentId: "tour-1" },
                { dayOrder: 2, rangeNumber: 2, tournamentId: "tour-2" },
            ],
        } as never)
        prismaMock.participant.findMany.mockResolvedValue([] as never)

        await expect(enrollChampionshipCompetitorsOnDay("champ-1", 2, ["M-001", "M-002"])).resolves.toEqual({
            enrolledCount: 2,
            skippedCount: 0,
        })

        expect(prismaMock.participant.findMany).toHaveBeenCalledTimes(1)
        expect(prismaMock.participant.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    membershipNo: { in: ["M-001", "M-002"] },
                }),
            })
        )
    })

    it("enrolls assigned competitors and reports how many were skipped", async () => {
        prismaMock.championship.findFirst.mockResolvedValue({
            ...writableChampionshipShell,
            rangeCount: 2,
            divisionRanges: [
                {
                    dayOrder: 1,
                    ageGroupId: "age-1",
                    categoryId: "cat-1",
                    genderGroup: "M",
                    rangeNumber: 1,
                },
            ],
            rounds: [
                { dayOrder: 1, rangeNumber: 1, tournamentId: "tour-1" },
                { dayOrder: 1, rangeNumber: 2, tournamentId: "tour-1b" },
            ],
        } as never)

        await expect(enrollChampionshipCompetitorsOnDay("champ-1", 1, ["M-001", "M-002"])).resolves.toEqual({
            enrolledCount: 1,
            skippedCount: 1,
        })

        expect(prismaMock.participant.upsert).toHaveBeenCalledTimes(1)
    })
})

describe("unenrollChampionshipCompetitorFromDay", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue(writableChampionshipShell as never)
        prismaMock.participant.findFirst.mockResolvedValue({ id: "part-1" } as never)
        prismaMock.participant.delete.mockResolvedValue({ id: "part-1", tournamentId: "tour-1" } as never)
    })

    it("deletes the day participant row", async () => {
        await expect(unenrollChampionshipCompetitorFromDay("champ-1", 1, "M-001")).resolves.toBeUndefined()
        expect(prismaMock.participant.delete).toHaveBeenCalledWith({ where: { id: "part-1" } })
    })

    it("throws when competitor is not enrolled on the day", async () => {
        prismaMock.participant.findFirst.mockResolvedValue(null)

        await expect(unenrollChampionshipCompetitorFromDay("champ-1", 1, "M-001")).rejects.toThrow(
            "Competitor is not enrolled on this day"
        )
    })
})

describe("updateChampionshipRegistration", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue(writableChampionshipShell as never)
        prismaMock.championshipRegistration.findFirst.mockResolvedValue({
            id: "reg-1",
            membershipNo: "M-001",
            competitorNumber: 1,
        } as never)
        prismaMock.$transaction.mockImplementation((callback) =>
            typeof callback === "function" ? callback(prismaMock) : Promise.resolve(callback)
        )
        prismaMock.championshipRegistration.update.mockResolvedValue({ id: "reg-1" } as never)
        prismaMock.participant.updateMany.mockResolvedValue({ count: 2 } as never)
    })

    it("updates registration and syncs enrolled day participants", async () => {
        await expect(
            updateChampionshipRegistration("champ-1", "reg-1", {
                name: "Alex Updated",
                membershipNo: "M-001",
                ageGroupId: "age-2",
                categoryId: "cat-2",
                club: "Club B",
                genderGroup: "F",
            })
        ).resolves.toBeUndefined()

        expect(prismaMock.championshipRegistration.update).toHaveBeenCalledWith({
            where: { id: "reg-1" },
            data: {
                name: "Alex Updated",
                membershipNo: "M-001",
                ageGroupId: "age-2",
                categoryId: "cat-2",
                club: "Club B",
                genderGroup: "F",
            },
        })
        expect(prismaMock.participant.updateMany).toHaveBeenCalledWith({
            where: {
                membershipNo: "M-001",
                tournament: {
                    championshipRound: { championshipId: "champ-1" },
                },
            },
            data: expect.objectContaining({
                name: "Alex Updated",
                membershipNo: "M-001",
                competitorNumber: 1,
            }),
        })
    })

    it("throws when registration is not found", async () => {
        prismaMock.championshipRegistration.findFirst.mockResolvedValue(null)

        await expect(
            updateChampionshipRegistration("champ-1", "reg-missing", {
                name: "Alex Updated",
                membershipNo: "M-001",
                ageGroupId: "age-2",
                categoryId: "cat-2",
                club: "Club B",
                genderGroup: "F",
            })
        ).rejects.toThrow("Registration not found")
    })
})

describe("removeChampionshipRegistration", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({ id: "champ-1", isArchive: false, rounds: [], registrations: [] } as never)
    })

    it("removes registration when competitor is not enrolled on any day", async () => {
        prismaMock.championshipRegistration.findFirst.mockResolvedValue({
            id: "reg-1",
            membershipNo: "M-001",
        } as never)
        prismaMock.participant.findFirst.mockResolvedValue(null)
        prismaMock.championshipRegistration.delete.mockResolvedValue({ id: "reg-1" } as never)

        await expect(removeChampionshipRegistration("champ-1", "reg-1")).resolves.toBeUndefined()
        expect(prismaMock.championshipRegistration.delete).toHaveBeenCalledWith({
            where: { id: "reg-1" },
        })
    })

    it("throws when competitor is enrolled on a championship day", async () => {
        prismaMock.championshipRegistration.findFirst.mockResolvedValue({
            id: "reg-1",
            membershipNo: "M-001",
        } as never)
        prismaMock.participant.findFirst.mockResolvedValue({ id: "part-1" } as never)

        await expect(removeChampionshipRegistration("champ-1", "reg-1")).rejects.toThrow(
            "Cannot remove a competitor enrolled on a championship day"
        )
        expect(prismaMock.championshipRegistration.delete).not.toHaveBeenCalled()
    })

    it("throws when registration is not found", async () => {
        prismaMock.championshipRegistration.findFirst.mockResolvedValue(null)

        await expect(removeChampionshipRegistration("champ-1", "reg-missing")).rejects.toThrow(
            "Registration not found"
        )
    })
})

describe("archiveChampionship", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({ id: "champ-1", isArchive: false } as never)
        prismaMock.championship.update.mockResolvedValue({ id: "champ-1", isArchive: true, rounds: [] } as never)
    })

    it("archives an authorized championship", async () => {
        await expect(archiveChampionship("champ-1")).resolves.toMatchObject({ id: "champ-1", isArchive: true })
        expect(prismaMock.championship.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "champ-1" },
                data: { isArchive: true },
            })
        )
    })
})

describe("listMyChampionshipsForClubs", () => {
    it("excludes archived championships by default", async () => {
        prismaMock.championship.findMany.mockResolvedValue([] as never)

        await listMyChampionshipsForClubs(["ClubA"], false)

        expect(prismaMock.championship.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ isArchive: false }),
            })
        )
    })

    it("includes archived championships when requested", async () => {
        prismaMock.championship.findMany.mockResolvedValue([] as never)

        await listMyChampionshipsForClubs(["ClubA"], true)

        const call = prismaMock.championship.findMany.mock.calls[0][0]
        expect(call.where.isArchive).toBeUndefined()
    })
})

describe("getChampionshipSharingStatus", () => {
    it("returns null when championship is out of scope", async () => {
        prismaMock.championship.findFirst.mockResolvedValue(null)

        await expect(getChampionshipSharingStatus("champ-1")).resolves.toBeNull()
    })

    it("returns sharing status for linked tournaments", async () => {
        prismaMock.championship.findFirst.mockResolvedValue({
            id: "champ-1",
            rounds: [
                {
                    tournamentId: "tour-1",
                    tournament: { isPublished: false, isShared: true },
                },
                {
                    tournamentId: "tour-2",
                    tournament: { isPublished: false, isShared: true },
                },
            ],
        } as never)

        await expect(getChampionshipSharingStatus("champ-1")).resolves.toEqual({
            tournamentCount: 2,
            sharingOption: "link-shared",
        })
    })
})

describe("updateChampionshipSharingSettings", () => {
    beforeEach(() => {
        prismaMock.championship.findFirst.mockResolvedValue({
            id: "champ-1",
            isArchive: false,
            rounds: [{ tournamentId: "tour-1" }, { tournamentId: "tour-2" }],
        } as never)
        prismaMock.tournament.updateMany.mockResolvedValue({ count: 2 } as never)
    })

    it("updates all linked tournaments", async () => {
        await updateChampionshipSharingSettings("champ-1", false, true)

        expect(prismaMock.tournament.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ["tour-1", "tour-2"] } },
            data: { isPublished: false, isShared: true },
        })
    })

    it("allows public sharing without score validation", async () => {
        await updateChampionshipSharingSettings("champ-1", true, true)

        expect(prismaMock.tournament.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ["tour-1", "tour-2"] } },
            data: { isPublished: true, isShared: true },
        })
    })

    it("throws when there are no day tournaments", async () => {
        prismaMock.championship.findFirst.mockResolvedValue({
            id: "champ-1",
            isArchive: false,
            rounds: [],
        } as never)

        await expect(updateChampionshipSharingSettings("champ-1", false, true)).rejects.toThrow(
            "Add at least one championship day before sharing results"
        )
    })
})
