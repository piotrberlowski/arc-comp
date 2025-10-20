import * as ExcelJS from 'exceljs'
import { ParticipantResultData, TournamentResultsData } from '../resultsActions'
import { getIFAFAgeGenderMapping } from './mappings'
import { IFAFTransformedData } from './types'

interface BowStyleGroup {
    bowStyle: {
        code: string
        name: string
        number: string
    }
    ageGenderGroups: Array<{
        category: {
            code: string
            name: string
        }
        participants: Array<{
            name: string
            membershipNumber?: string
            club: string
            score: number
            place: number
        }>
    }>
}

const lookupStart = 12

export class IFAFXLSXProcessor {
    private templatePath: string

    constructor(templatePath: string) {
        this.templatePath = templatePath
    }

    async processTournamentResults(tournamentData: TournamentResultsData): Promise<Buffer> {
        // 1. Load template
        const template = await this.loadTemplate()

        // 2. Transform data to IFAF format with proper grouping
        const ifafData = await this.transformToIFAF(tournamentData)

        // 3. Fill template with data, maintaining structure
        const filledWorkbook = await this.fillTemplate(template, ifafData)

        // 4. Return as buffer
        return await this.workbookToBuffer(filledWorkbook)
    }

    private async loadTemplate(): Promise<ExcelJS.Workbook> {
        const path = await import('path')
        const templatePath = path.join(process.cwd(), 'resources', 'templatev2.xlsx')

        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(templatePath)
        return workbook
    }

    private async getAllBowStyleMappings() {
        const { prismaOrThrow } = await import('../../../../../lib/prisma')
        return await prismaOrThrow("get all IFAF bow style mappings").iFAFBowStyleMapping.findMany({
            orderBy: { ifafBowStyleNumber: 'asc' }
        })
    }

    private async getBowStyleMapping(equipmentCategoryId: string) {
        const { prismaOrThrow } = await import('../../../../../lib/prisma')
        return await prismaOrThrow("get IFAF bow style mapping").iFAFBowStyleMapping.findUnique({
            where: { equipmentCategoryId },
            include: { equipmentCategory: true }
        })
    }

    private async transformToIFAF(tournamentData: TournamentResultsData): Promise<IFAFTransformedData> {
        // Group participants by equipment category
        const equipmentGroups = new Map<string, Array<ParticipantResultData>>()
        for (const participant of tournamentData.participants) {
            const equipmentCategoryId = participant.participant.categoryId
            if (!equipmentGroups.has(equipmentCategoryId)) {
                equipmentGroups.set(equipmentCategoryId, [])
            }
            equipmentGroups.get(equipmentCategoryId)!.push(participant)
        }

        const bowStyleGroups = []

        // Process each equipment category that has participants
        for (const [equipmentCategoryId, participants] of equipmentGroups) {
            // Get IFAF bow style mapping
            const bowStyleMapping = await this.getBowStyleMapping(equipmentCategoryId)
            if (!bowStyleMapping) continue

            // Group participants by age group + gender
            const ageGenderGroups = new Map<string, Array<ParticipantResultData>>()
            for (const participant of participants) {
                const ageGroupId = participant.participant.ageGroupId
                const genderGroup = participant.participant.genderGroup
                const key = `${ageGroupId}-${genderGroup}`
                if (!ageGenderGroups.has(key)) {
                    ageGenderGroups.set(key, [])
                }
                ageGenderGroups.get(key)!.push(participant)
            }

            // Get IFAF age/gender mappings and sort by category code
            const ifafAgeGenderGroups = []
            for (const [key, groupParticipants] of ageGenderGroups) {
                const [ageGroupId, genderGroup] = key.split('-')
                const ageGenderMapping = await getIFAFAgeGenderMapping(ageGroupId, genderGroup)
                if (ageGenderMapping) {
                    const sortedParticipants = groupParticipants.sort((a, b) => {
                        if (a.score !== b.score) {
                            return (b.score || 0) - (a.score || 0)
                        }
                        return a.participant.name.localeCompare(b.participant.name)
                    })

                    ifafAgeGenderGroups.push({
                        category: {
                            code: ageGenderMapping.ifafCategoryCode,
                            name: `${ageGenderMapping.ifafCategoryCode}. ${ageGenderMapping.ifafCategoryName}`
                        },
                        participants: sortedParticipants.map((participant, index) => ({
                            name: participant.participant.name,
                            membershipNumber: undefined,
                            club: participant.participant.club || 'Independent',
                            score: participant.score || 0,
                            place: index + 1
                        }))
                    })
                }
            }

            // Sort age/gender groups by IFAF category code
            ifafAgeGenderGroups.sort((a, b) => parseInt(a.category.code) - parseInt(b.category.code))

            bowStyleGroups.push({
                bowStyle: {
                    code: bowStyleMapping.ifafBowStyleCode,
                    name: bowStyleMapping.ifafBowStyleName,
                    number: bowStyleMapping.ifafBowStyleNumber
                },
                ageGenderGroups: ifafAgeGenderGroups
            })
        }

        return {
            tournamentInfo: {
                name: tournamentData.tournament.name,
                date: tournamentData.tournament.date.toISOString().split('T')[0],
                organizer: tournamentData.tournament.organizerClub
            },
            bowStyleGroups
        }
    }

    private async fillTemplate(template: ExcelJS.Workbook, data: IFAFTransformedData): Promise<ExcelJS.Workbook> {
        const worksheet = template.getWorksheet('Results')
        if (!worksheet) throw new Error('Results worksheet not found')

        // Fill tournament info
        worksheet.getCell('B8').value = data.tournamentInfo.organizer // Host Club
        worksheet.getCell('B9').value = '3D' // Round
        worksheet.getCell('E9').value = data.bowStyleGroups.reduce((sum, group) =>
            sum + group.ageGenderGroups.reduce((sum2, ageGroup) => sum2 + ageGroup.participants.length, 0), 0
        ) // # of competitors
        worksheet.getCell('D10').value = data.tournamentInfo.date // Date (next to "Date:" at C10)

        // 1. Load ALL bowstyles from database
        const allBowStyleMappings = await this.getAllBowStyleMappings()

        // 2. Create a map of results by bowstyle number for quick lookup
        const resultsByBowStyle = new Map<string, BowStyleGroup>()
        for (const bowStyleGroup of data.bowStyleGroups) {
            resultsByBowStyle.set(bowStyleGroup.bowStyle.number, bowStyleGroup)
        }

        let currentRow = lookupStart

        // 3. Process each bowstyle in order
        for (const bowStyleMapping of allBowStyleMappings) {
            console.log('IFAF Export: Processing bow style', bowStyleMapping.ifafBowStyleNumber, ':', bowStyleMapping.ifafBowStyleName)

            // 3.1 Find header row for this bowstyle
            const headingRow = this.findBowStyleHeading(worksheet, bowStyleMapping.ifafBowStyleNumber, currentRow)
            if (!headingRow) {
                console.log('IFAF Export: No heading found for bow style', bowStyleMapping.ifafBowStyleNumber)
                continue
            }

            // 3.3 Get results for this bowstyle (if present)
            const bowStyleGroup = resultsByBowStyle.get(bowStyleMapping.ifafBowStyleNumber)
            const results = bowStyleGroup?.ageGenderGroups || []

            // skip the header and the following empty row
            currentRow = headingRow + 2

            if (results.length === 0) {
                console.log('IFAF Export: No participants for bow style', bowStyleMapping.ifafBowStyleNumber, '- skipping data insertion')
                continue
            }

            for (let groupIndex = 0; groupIndex < results.length; groupIndex++) {
                const ageGenderGroup = results[groupIndex]

                // 3.4.1 Process each participant in this gender-age group
                for (const participant of ageGenderGroup.participants) {
                    const rowValues = [
                        ageGenderGroup.category.name,
                        participant.name,
                        participant.membershipNumber || '',
                        participant.club,
                        participant.score
                    ]
                    // 3.4.1.1 Insert new row
                    worksheet.insertRow(currentRow, rowValues, 'i+');
                    currentRow++
                }
                worksheet.insertRow(currentRow, [], 'i+');
                currentRow++

            }
        }

        console.log(`IFAF Export: ${worksheet.rowCount}/$${worksheet.actualRowCount}}`)

        return template
    }


    private findBowStyleHeading(worksheet: ExcelJS.Worksheet, bowStyleNumber: string, fromRow: number): number | null {
        let foundRow: number | null = null

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber < fromRow) return // Skip header rows (but include row 12 which has heading 01)

            const cellA = row.getCell(1)
            if (cellA.value && typeof cellA.value === 'string') {
                const cellValue = cellA.value.toString()
                // Look for patterns like "01. Barebow Compound (BB-C)" - these are the main bow style headings
                // Must have parentheses to distinguish from age/gender categories
                const match = cellValue.match(/^(\d{2})\.\s+(.+)\s*\(.*\)?$/)
                if (match && match[1] === bowStyleNumber) {
                    foundRow = rowNumber
                    return false // Stop iteration
                }
            }
        })

        console.log(`IFAF Export: Looking for bow style ${bowStyleNumber}, found at row ${foundRow}`)
        return foundRow
    }


    private async workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
        const buffer = await workbook.xlsx.writeBuffer()
        return Buffer.from(buffer)
    }
}
