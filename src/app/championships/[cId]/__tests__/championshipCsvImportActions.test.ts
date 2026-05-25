import { GenderGroup } from "@/generated/prisma/enums"
import { prismaMock } from "@/test/prismaSingleton"
import { importChampionshipRegistrationsCSV } from "../championshipCsvImportActions"

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}))

jest.mock("@/lib/championshipOrganizerSession", () => ({
    assertChampionshipOrganizerClubs: jest.fn().mockResolvedValue(["ClubA"]),
}))

const initialState = {
    success: false,
    message: "",
    importedCount: 0,
    errors: [] as string[],
}

const validationSeed = () => {
    prismaMock.ageGroup.findMany.mockResolvedValue([
        { id: "S", name: "Senior" },
        { id: "A", name: "Adult" },
    ] as never)
    prismaMock.equipmentCategory.findMany.mockResolvedValue([
        { id: "BBC", name: "Barebow Compound" },
        { id: "FSR", name: "Freestyle Recurve" },
    ] as never)
}

const writableChampionship = () => {
    prismaMock.championship.findFirst
        .mockResolvedValueOnce({ id: "champ-1" } as never)
        .mockResolvedValueOnce({ isArchive: false } as never)
}

describe("importChampionshipRegistrationsCSV", () => {
    beforeEach(() => {
        validationSeed()
        writableChampionship()
        prismaMock.$transaction.mockImplementation((callback) =>
            typeof callback === "function" ? callback(prismaMock) : Promise.resolve(callback)
        )
        prismaMock.championshipRegistration.aggregate.mockResolvedValue({
            _max: { competitorNumber: 2 },
        } as never)
        prismaMock.championshipRegistration.createMany.mockResolvedValue({ count: 2 } as never)
    })

    it("returns error when championship id is missing", async () => {
        const fd = new FormData()
        fd.set("csvText", "John Doe,12345,M,S,BBC,Archery Club")

        const result = await importChampionshipRegistrationsCSV(initialState, fd)

        expect(result.success).toBe(false)
        expect(result.errors).toContain("Championship ID not found")
    })

    it("returns parse errors for invalid rows", async () => {
        const fd = new FormData()
        fd.set("championshipId", "champ-1")
        fd.set("csvText", "John Doe,12345,X,S,BBC,Archery Club")

        const result = await importChampionshipRegistrationsCSV(initialState, fd)

        expect(result.success).toBe(false)
        expect(result.errors.some((error) => error.includes("Gender must be"))).toBe(true)
        expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it("rejects rows with empty club", async () => {
        const fd = new FormData()
        fd.set("championshipId", "champ-1")
        fd.set("csvText", "John Doe,12345,M,S,BBC,")

        const result = await importChampionshipRegistrationsCSV(initialState, fd)

        expect(result.success).toBe(false)
        expect(result.errors).toContain("Row 1: Club is required")
        expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it("imports valid rows with sequential competitor numbers", async () => {
        const fd = new FormData()
        fd.set("championshipId", "champ-1")
        fd.set("csvText", `John Doe,12345,M,S,BBC,Archery Club
Jane Smith,67890,F,A,FSR,Independent`)

        const result = await importChampionshipRegistrationsCSV(initialState, fd)

        expect(result).toEqual({
            success: true,
            message: "Successfully imported 2 competitors",
            importedCount: 2,
            errors: [],
        })
        expect(prismaMock.championshipRegistration.createMany).toHaveBeenCalledWith({
            data: [
                {
                    championshipId: "champ-1",
                    name: "John Doe",
                    membershipNo: "12345",
                    ageGroupId: "S",
                    categoryId: "BBC",
                    club: "Archery Club",
                    genderGroup: GenderGroup.M,
                    competitorNumber: 3,
                },
                {
                    championshipId: "champ-1",
                    name: "Jane Smith",
                    membershipNo: "67890",
                    ageGroupId: "A",
                    categoryId: "FSR",
                    club: "Independent",
                    genderGroup: GenderGroup.F,
                    competitorNumber: 4,
                },
            ],
        })
    })

    it("returns duplicate membership error from database", async () => {
        prismaMock.$transaction.mockRejectedValue({
            code: "P2002",
            meta: { target: ["championshipId", "membershipNo"] },
            message: "Unique constraint failed",
        })

        const fd = new FormData()
        fd.set("championshipId", "champ-1")
        fd.set("csvText", "John Doe,12345,M,S,BBC,Archery Club")

        const result = await importChampionshipRegistrationsCSV(initialState, fd)

        expect(result.success).toBe(false)
        expect(result.errors[0]).toContain("Duplicate entry")
    })
})
