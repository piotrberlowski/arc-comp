import { IFAFAgeGenderMapping, IFAFBowStyleMapping } from "@/generated/prisma/client"
import * as ExcelJS from 'exceljs'
import { ParticipantResultData, TournamentResultsData } from '../../resultsActions'

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

    async processTournamentResults(tournamentData: TournamentResultsData): Promise<Buffer> {
        // 1. Load template
        const template = await this.loadTemplate()

        // 2. Fill template header with tournament data
        this.fillTemplateHeader(template, tournamentData)

        // 3. Process template row by row
        const filledWorkbook = await this.processTemplateRows(template, tournamentData)

        // 4. Return as buffer
        return await this.workbookToBuffer(filledWorkbook)
    }

    private async loadTemplate(): Promise<ExcelJS.Workbook> {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(this.templatePath)
        return workbook
    }

    private fillTemplateHeader(workbook: ExcelJS.Workbook, tournamentData: TournamentResultsData): void {
        const worksheet = workbook.getWorksheet('Results')
        if (!worksheet) throw new Error('Results worksheet not found')

        // Fill tournament info in header
        worksheet.getCell('B8').value = tournamentData.tournament.organizerClub // Host Club
        worksheet.getCell('B9').value = tournamentData.tournament.format.name // Round
        worksheet.getCell('E9').value = tournamentData.participants.length // # of competitors
        worksheet.getCell('D10').value = tournamentData.tournament.date.toISOString().split('T')[0] // Date
    }

    private async processTemplateRows(workbook: ExcelJS.Workbook, tournamentData: TournamentResultsData): Promise<ExcelJS.Workbook> {
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
                    // Get participants for this bow style
                    const participants = this.getParticipantsForBowStyle(tournamentData, bowStyleMapping)

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
        tournamentData: TournamentResultsData,
        bowStyleMapping: IFAFBowStyleMapping & { equipmentCategory: { id: string; name: string } }
    ): ParticipantResultData[] {
        return tournamentData.participants.filter(participant =>
            participant.category.id === bowStyleMapping.equipmentCategoryId
        )
    }

    private async processBowStyleParticipants(
        worksheet: ExcelJS.Worksheet,
        participants: ParticipantResultData[],
        headingRow: number
    ): Promise<void> {
        // Skip the empty row after the heading
        let currentRow = headingRow + 2

        // Group participants by age/gender
        const participantsByAgeGender = this.groupParticipantsByAgeGender(participants)

        // Process each age/gender group
        for (const [ageGenderKey, groupParticipants] of participantsByAgeGender) {
            const ageGenderMapping = this.ageGenderMap.get(ageGenderKey)
            if (!ageGenderMapping) continue

            // Sort participants by score (descending)
            const sortedParticipants = this.sortParticipants(groupParticipants)

            // Insert participant rows
            currentRow = this.insertParticipantRows(worksheet, sortedParticipants, ageGenderMapping, currentRow)

            // Insert empty row after each age/gender group
            worksheet.insertRow(currentRow, [], 'i+')
            currentRow++
        }
    }

    private groupParticipantsByAgeGender(participants: ParticipantResultData[]): Map<string, ParticipantResultData[]> {
        const participantsByAgeGender = new Map<string, ParticipantResultData[]>()
        for (const participant of participants) {
            const key = `${participant.ageGroupId}-${participant.genderGroup}`
            if (!participantsByAgeGender.has(key)) {
                participantsByAgeGender.set(key, [])
            }
            participantsByAgeGender.get(key)!.push(participant)
        }
        return participantsByAgeGender
    }

    private sortParticipants(participants: ParticipantResultData[]): ParticipantResultData[] {
        return participants.sort((a, b) => {
            if (a.participantScore.score !== b.participantScore.score) {
                return b.participantScore.score - a.participantScore.score
            }
            return a.name.localeCompare(b.name)
        })
    }

    private insertParticipantRows(
        worksheet: ExcelJS.Worksheet,
        participants: ParticipantResultData[],
        ageGenderMapping: IFAFAgeGenderMapping & { ageGroup: { id: string; name: string } },
        currentRow: number
    ): number {
        for (const participant of participants) {
            const rowValues = [
                `${ageGenderMapping.ifafCategoryCode}. ${ageGenderMapping.ifafCategoryName}`,
                participant.name,
                participant.membershipNo || '',
                participant.club || 'Independent',
                participant.participantScore.score
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
