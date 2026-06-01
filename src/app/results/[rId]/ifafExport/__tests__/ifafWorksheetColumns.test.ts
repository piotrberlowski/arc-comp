import * as ExcelJS from "exceljs"
import { join } from "path"
import { fillScoreColumnHeaders, trimExcessScoreColumns } from "../ifafWorksheetColumns"

describe("ifafWorksheetColumns", () => {
    it("removes unused score columns from the left of the E–J block starting at E", async () => {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(join(process.cwd(), "resources", "templatev5.xlsx"))
        const worksheet = workbook.getWorksheet("Results")
        expect(worksheet).toBeDefined()
        if (!worksheet) {
            return
        }

        trimExcessScoreColumns(worksheet, 3)

        const row = 12
        expect(worksheet.getCell(row, 5).value).toBe("Score")
        expect(worksheet.getCell(row, 6).value).toBe("Score")
        expect(worksheet.getCell(row, 7).value).toBe("Score")
        expect(worksheet.getCell(row, 8).value).toBeNull()
    })

    it("writes multi-range score column headers from column E", async () => {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(join(process.cwd(), "resources", "templatev5.xlsx"))
        const worksheet = workbook.getWorksheet("Results")
        expect(worksheet).toBeDefined()
        if (!worksheet) {
            return
        }

        trimExcessScoreColumns(worksheet, 3)
        fillScoreColumnHeaders(worksheet, 12, ["3D-Std", "Field", "total"])

        expect(worksheet.getCell(12, 5).value).toBe("3D-Std")
        expect(worksheet.getCell(12, 6).value).toBe("Field")
        expect(worksheet.getCell(12, 7).value).toBe("total")
    })
})
