import { formatIfafExportDateRange } from "../ifafExportDate"

describe("formatIfafExportDateRange", () => {
    it("returns a single date when start and end match", () => {
        expect(formatIfafExportDateRange(new Date("2024-06-02"), new Date("2024-06-02"))).toBe("2024-06-02")
    })

    it("returns a range when start and end differ", () => {
        expect(formatIfafExportDateRange(new Date("2024-06-01"), new Date("2024-06-03"))).toBe("2024-06-01 – 2024-06-03")
    })
})
