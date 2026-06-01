import { IFAFAgeGenderMapping, IFAFBowStyleMapping } from "@/generated/prisma/client"
import * as ExcelJS from 'exceljs'
import type { IfafExportData, IfafExportParticipant } from './ifafExportTypes'
import { formatIfafExportDateRange } from './ifafExportDate'
import { fillScoreColumnHeaders, scoreColumnCountForExport, trimExcessScoreColumns } from './ifafWorksheetColumns'

export class IFAFExcellExporter {
    private templatePath: string
    private bowStyleMap: Map<string, IFAFBowStyleMapping & { equipmentCategory: { id: string; name: string } }>
    private bowStyleNumberToCodeMap: Map<string, string>
    private ageGenderMap: Map<string, IFAFAgeGenderMapping & { ageGroup: { id: string; name: string } }>
    private allBowStyleMappings: (IFAFBowStyleMapping & { equipmentCategory: { id: string; name: string } })[]

    constructor(
        templatePath: string,
        iFAFBowStyleMappings: (IFAFBowStyleMapping & { equipmentCategory: { id: string; name: string } })[],
        iFAFAgeGenderMappings: (IFAFAgeGenderMapping & { ageGroup: { id: string; name: string } })[]
    ) {
        this.templatePath = templatePath

        // Create lookup maps for O(1) access
        this.bowStyleMap = new Map()
        this.bowStyleNumberToCodeMap = new Map()
        for (const mapping of iFAFBowStyleMappings) {
            this.bowStyleMap.set(mapping.ifafBowStyleCode, mapping)
            this.bowStyleNumberToCodeMap.set(mapping.ifafBowStyleNumber, mapping.ifafBowStyleCode)
        }

        this.ageGenderMap = new Map()
        for (const mapping of iFAFAgeGenderMappings) {
            const key = `${mapping.ageGroupId}-${mapping.genderGroup}`
            this.ageGenderMap.set(key, mapping)
        }

        // Sort bowstyle mappings by number for template processing
        this.allBowStyleMappings = [...iFAFBowStyleMappings].sort(
            (a, b) => parseInt(a.ifafBowStyleNumber) - parseInt(b.ifafBowStyleNumber)
        )
    }

    async processExportData(exportData: IfafExportData): Promise<Buffer> {
        // 1. Load template
        const template = await this.loadTemplate()
        const worksheet = template.getWorksheet('Results')
        if (!worksheet) {
            throw new Error('Results worksheet not found')
        }

        // 2. Remove unused score columns (template provides six; keep only what export needs)
        trimExcessScoreColumns(worksheet, scoreColumnCountForExport(exportData.participants))

        // 3. Fill template header
        this.fillTemplateHeader(template, exportData)

        // 4. Process template row by row
        const filledWorkbook = await this.processTemplateRows(template, exportData)

        // 5. Return as buffer
        return await this.workbookToBuffer(filledWorkbook)
    }

    private async loadTemplate(): Promise<ExcelJS.Workbook> {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(this.templatePath)
        return workbook
    }

    private fillBowStyleScoreColumnHeaders(
        worksheet: ExcelJS.Worksheet,
        bowStyleHeaderRow: number,
        exportData: IfafExportData
    ): void {
        const headers = exportData.scoreColumnHeaders
        if (!headers || headers.length <= 1) {
            return
        }

        fillScoreColumnHeaders(worksheet, bowStyleHeaderRow, headers)
    }

    private fillTemplateHeader(workbook: ExcelJS.Workbook, exportData: IfafExportData): void {
        const worksheet = workbook.getWorksheet('Results')
        if (!worksheet) throw new Error('Results worksheet not found')

        // Fill tournament info in header
        worksheet.getCell('B8').value = exportData.organizerClub // Host Club
        worksheet.getCell('B9').value = exportData.roundLabel // Round
        worksheet.getCell('E9').value = exportData.participantCount // # of competitors
        worksheet.getCell('D10').value = formatIfafExportDateRange(exportData.dateStart, exportData.dateEnd)
    }

    private async processTemplateRows(workbook: ExcelJS.Workbook, exportData: IfafExportData): Promise<ExcelJS.Workbook> {
        const worksheet = workbook.getWorksheet('Results')
        if (!worksheet) throw new Error('Results worksheet not found')

        let currentRow = 1 // Start from the first row
        let processedBowStyles = 0
        const totalBowStyles = this.allBowStyleMappings.length

        // Iterate row-by-row through the template
        while (currentRow <= worksheet.rowCount && processedBowStyles < totalBowStyles) {
            const row = worksheet.getRow(currentRow)

            // Check if this row contains a bowstyle heading
            const bowStyleCode = this.extractBowStyleFromRow(row)
            if (bowStyleCode) {
                processedBowStyles++

                // Get the bowstyle mapping for this code
                const bowStyleMapping = this.bowStyleMap.get(bowStyleCode)
                if (bowStyleMapping) {
                    this.fillBowStyleScoreColumnHeaders(worksheet, currentRow, exportData)

                    // Get participants for this bow style
                    const participants = this.getParticipantsForBowStyle(exportData, bowStyleMapping)

                    if (participants.length > 0) {
                        // Process participants for this bowstyle
                        await this.processBowStyleParticipants(worksheet, participants, currentRow)
                    } else {
                        console.info(`IFAF Export: No participants for bow style ${bowStyleCode} - skipping data insertion`)
                    }
                }

                // Move to next row (skip the empty row after heading)
                currentRow += 2
            } else {
                // Not a bowstyle heading, move to next row
                currentRow++
            }
        }

        return workbook
    }

    private extractBowStyleFromRow(row: ExcelJS.Row): string | null {
        // Check if this row contains a bowstyle heading by looking for the pattern
        // The bowstyle headings are typically in column A and contain the IFAF code
        const cellA = row.getCell(1)
        const cellValue = cellA.value?.toString() || ''

        // Look for patterns like "01. Barebow Compound (BB-C)" - these are the main bow style headings
        // Must have parentheses to distinguish from age/gender categories
        const match = cellValue.match(/^(\d{2})\.\s+(.+)\s*\(.*\)?$/)
        if (match) {
            const bowStyleNumber = match[1]
            // Use reverse lookup map for O(1) access
            return this.bowStyleNumberToCodeMap.get(bowStyleNumber) || null
        }

        return null
    }

    private getParticipantsForBowStyle(
        exportData: IfafExportData,
        bowStyleMapping: IFAFBowStyleMapping & { equipmentCategory: { id: string; name: string } }
    ): IfafExportParticipant[] {
        return exportData.participants.filter(
            (participant) => participant.categoryId === bowStyleMapping.equipmentCategoryId
        )
    }

    private async processBowStyleParticipants(
        worksheet: ExcelJS.Worksheet,
        participants: IfafExportParticipant[],
        headingRow: number
    ): Promise<void> {
        // Skip the empty row after the heading
        let currentRow = headingRow + 2

        // Group participants by age/gender
        const participantsByAgeGender = this.groupParticipantsByAgeGender(participants)

        // Process each age/gender group (sorted by last score column descending)
        for (const [ageGenderKey, groupParticipants] of participantsByAgeGender) {
            const sorted = [...groupParticipants].sort(compareParticipantsByLastScoreColumn)
            const ageGenderMapping = this.ageGenderMap.get(ageGenderKey)
            if (!ageGenderMapping) continue

            currentRow = this.insertParticipantRows(worksheet, sorted, ageGenderMapping, currentRow)

            // Insert empty row after each age/gender group
            worksheet.insertRow(currentRow, [], 'i+')
            currentRow++
        }
    }

    private groupParticipantsByAgeGender(participants: IfafExportParticipant[]): Map<string, IfafExportParticipant[]> {
        const participantsByAgeGender = new Map<string, IfafExportParticipant[]>()
        for (const participant of participants) {
            const key = `${participant.ageGroupId}-${participant.genderGroup}`
            if (!participantsByAgeGender.has(key)) {
                participantsByAgeGender.set(key, [])
            }
            participantsByAgeGender.get(key)!.push(participant)
        }
        return participantsByAgeGender
    }

    private insertParticipantRows(
        worksheet: ExcelJS.Worksheet,
        participants: IfafExportParticipant[],
        ageGenderMapping: IFAFAgeGenderMapping & { ageGroup: { id: string; name: string } },
        currentRow: number
    ): number {
        for (const participant of participants) {
            const rowValues = [
                `${ageGenderMapping.ifafCategoryCode}. ${ageGenderMapping.ifafCategoryName}`,
                participant.name,
                participant.membershipNo || '',
                participant.club || 'Independent',
                ...participant.scoreColumns,
            ]
            worksheet.insertRow(currentRow, rowValues, 'i+')
            currentRow++
        }
        return currentRow
    }

    private async workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
        const buffer = await workbook.xlsx.writeBuffer()
        return Buffer.from(buffer)
    }
}

function compareParticipantsByLastScoreColumn(left: IfafExportParticipant, right: IfafExportParticipant): number {
    const leftScore = left.scoreColumns[left.scoreColumns.length - 1] ?? ""
    const rightScore = right.scoreColumns[right.scoreColumns.length - 1] ?? ""
    const leftNumeric = Number(leftScore)
    const rightNumeric = Number(rightScore)

    if (Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric)) {
        return rightNumeric - leftNumeric
    }

    return rightScore.localeCompare(leftScore)
}
