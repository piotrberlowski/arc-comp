import { IFAFAgeGenderMapping, IFAFBowStyleMapping } from '@prisma/client'
import * as ExcelJS from 'exceljs'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { TournamentResultsData } from '../../../resultsActions'
import { IFAFExcellExporter } from '../ifafExcellExporter'

// Mock data based on seed.ts - all 12 bowstyles from the template
const mockIFAFBowStyleMappings: (IFAFBowStyleMapping & { equipmentCategory: { id: string; name: string } })[] = [
    {
        id: '1',
        equipmentCategoryId: 'BBC',
        ifafBowStyleCode: 'BB-C',
        ifafBowStyleName: 'Barebow Compound (BB-C)',
        ifafBowStyleNumber: '01',
        equipmentCategory: { id: 'BBC', name: 'Barebow Compound' }
    },
    {
        id: '2',
        equipmentCategoryId: 'BBR',
        ifafBowStyleCode: 'BB-R',
        ifafBowStyleName: 'Barebow Recurve (BB-R)',
        ifafBowStyleNumber: '02',
        equipmentCategory: { id: 'BBR', name: 'Barebow Recurve' }
    },
    {
        id: '3',
        equipmentCategoryId: 'BHC',
        ifafBowStyleCode: 'BH-C',
        ifafBowStyleName: 'Bowhunter Compound (BH-C)',
        ifafBowStyleNumber: '03',
        equipmentCategory: { id: 'BHC', name: 'Bowhunter Compound' }
    },
    {
        id: '4',
        equipmentCategoryId: 'BHR',
        ifafBowStyleCode: 'BH-R',
        ifafBowStyleName: 'Bowhunter Recurve (BH-R)',
        ifafBowStyleNumber: '04',
        equipmentCategory: { id: 'BHR', name: 'Bowhunter Recurve' }
    },
    {
        id: '5',
        equipmentCategoryId: 'BL',
        ifafBowStyleCode: 'BL',
        ifafBowStyleName: 'Bowhunter Limited (BL)',
        ifafBowStyleNumber: '05',
        equipmentCategory: { id: 'BL', name: 'Bowhunter Limited' }
    },
    {
        id: '6',
        equipmentCategoryId: 'BU',
        ifafBowStyleCode: 'BU',
        ifafBowStyleName: 'Bowhunter Unlimited (BU)',
        ifafBowStyleNumber: '06',
        equipmentCategory: { id: 'BU', name: 'Bowhunter Unlimited' }
    },
    {
        id: '7',
        equipmentCategoryId: 'FSC',
        ifafBowStyleCode: 'FS-C',
        ifafBowStyleName: 'Freestyle Ltd. Compound (FS-C)',
        ifafBowStyleNumber: '07',
        equipmentCategory: { id: 'FSC', name: 'Freestyle Compound' }
    },
    {
        id: '8',
        equipmentCategoryId: 'FSR',
        ifafBowStyleCode: 'FS-R',
        ifafBowStyleName: 'Freestyle Ltd. Recurve (FS-R)',
        ifafBowStyleNumber: '08',
        equipmentCategory: { id: 'FSR', name: 'Freestyle Recurve' }
    },
    {
        id: '9',
        equipmentCategoryId: 'FU',
        ifafBowStyleCode: 'FU',
        ifafBowStyleName: 'Freestyle Unlimited (FU)',
        ifafBowStyleNumber: '09',
        equipmentCategory: { id: 'FU', name: 'Freestyle Unlimited' }
    },
    {
        id: '10',
        equipmentCategoryId: 'LB',
        ifafBowStyleCode: 'LB',
        ifafBowStyleName: 'Longbow (LB)',
        ifafBowStyleNumber: '10',
        equipmentCategory: { id: 'LB', name: 'Longbow' }
    },
    {
        id: '11',
        equipmentCategoryId: 'HB',
        ifafBowStyleCode: 'HB',
        ifafBowStyleName: 'Historical Bow (HB)',
        ifafBowStyleNumber: '11',
        equipmentCategory: { id: 'HB', name: 'Historical Bow' }
    },
    {
        id: '12',
        equipmentCategoryId: 'TR',
        ifafBowStyleCode: 'TR-IFAA',
        ifafBowStyleName: 'Trad. Recurve (TR)',
        ifafBowStyleNumber: '12',
        equipmentCategory: { id: 'TR', name: 'Traditional Recurve' }
    }
]

const mockIFAFAgeGenderMappings: (IFAFAgeGenderMapping & { ageGroup: { id: string; name: string } })[] = [
    {
        id: '1',
        ageGroupId: 'S',
        genderGroup: 'M',
        ifafCategoryCode: '0',
        ifafCategoryName: 'Senior Male',
        ageGroup: { id: 'S', name: 'Senior' }
    },
    {
        id: '2',
        ageGroupId: 'S',
        genderGroup: 'F',
        ifafCategoryCode: '1',
        ifafCategoryName: 'Senior Female',
        ageGroup: { id: 'S', name: 'Senior' }
    },
    {
        id: '3',
        ageGroupId: 'A',
        genderGroup: 'M',
        ifafCategoryCode: '4',
        ifafCategoryName: 'Adult Male',
        ageGroup: { id: 'A', name: 'Adult' }
    },
    {
        id: '4',
        ageGroupId: 'A',
        genderGroup: 'F',
        ifafCategoryCode: '5',
        ifafCategoryName: 'Adult Female',
        ageGroup: { id: 'A', name: 'Adult' }
    },
    {
        id: '5',
        ageGroupId: 'J',
        genderGroup: 'M',
        ifafCategoryCode: '8',
        ifafCategoryName: 'Junior Male',
        ageGroup: { id: 'J', name: 'Junior' }
    }
]

const mockTournamentData: TournamentResultsData = {
    tournament: {
        id: 'test-tournament-1',
        name: 'Test Tournament 2024',
        date: new Date('2024-01-15'),
        formatId: 'format-1',
        organizerClub: 'Test Archery Club',
        isArchive: false,
        isPublished: true,
        isShared: false,
        format: {
            id: 'format-1',
            name: '3D-Standard Round',
            endCount: 28,
            groupSize: 4
        }
    },
    participants: [
        {
            id: 'participant-1',
            name: 'John Smith',
            membershipNo: 'MEM001',
            ageGroupId: 'S',
            categoryId: 'BBC',
            tournamentId: 'test-tournament-1',
            club: 'Test Archery Club',
            genderGroup: 'M',
            checkedIn: true,
            participantScore: {
                id: 'score-1',
                participantId: 'participant-1',
                tournamentId: 'test-tournament-1',
                score: 280
            },
            ageGroup: { id: 'S', name: 'Senior' },
            category: { id: 'BBC', name: 'Barebow Compound' }
        },
        {
            id: 'participant-2',
            name: 'Jane Doe',
            membershipNo: 'MEM002',
            ageGroupId: 'S',
            categoryId: 'BBC',
            tournamentId: 'test-tournament-1',
            club: 'Test Archery Club',
            genderGroup: 'F',
            checkedIn: true,
            participantScore: {
                id: 'score-2',
                participantId: 'participant-2',
                tournamentId: 'test-tournament-1',
                score: 275
            },
            ageGroup: { id: 'S', name: 'Senior' },
            category: { id: 'BBC', name: 'Barebow Compound' }
        },
        {
            id: 'participant-3',
            name: 'Bob Johnson',
            membershipNo: 'MEM003',
            ageGroupId: 'A',
            categoryId: 'BBR',
            tournamentId: 'test-tournament-1',
            club: 'Independent',
            genderGroup: 'M',
            checkedIn: true,
            participantScore: {
                id: 'score-3',
                participantId: 'participant-3',
                tournamentId: 'test-tournament-1',
                score: 290
            },
            ageGroup: { id: 'A', name: 'Adult' },
            category: { id: 'BBR', name: 'Barebow Recurve' }
        },
        {
            id: 'participant-4',
            name: 'Alice Wilson',
            membershipNo: 'MEM004',
            ageGroupId: 'A',
            categoryId: 'BBR',
            tournamentId: 'test-tournament-1',
            club: 'Test Archery Club',
            genderGroup: 'F',
            checkedIn: true,
            participantScore: {
                id: 'score-4',
                participantId: 'participant-4',
                tournamentId: 'test-tournament-1',
                score: 285
            },
            ageGroup: { id: 'A', name: 'Adult' },
            category: { id: 'BBR', name: 'Barebow Recurve' }
        },
        {
            id: 'participant-5',
            name: 'Mike Young',
            membershipNo: 'MEM005',
            ageGroupId: 'J',
            categoryId: 'BHC',
            tournamentId: 'test-tournament-1',
            club: 'Youth Archery Club',
            genderGroup: 'M',
            checkedIn: true,
            participantScore: {
                id: 'score-5',
                participantId: 'participant-5',
                tournamentId: 'test-tournament-1',
                score: 270
            },
            ageGroup: { id: 'J', name: 'Junior' },
            category: { id: 'BHC', name: 'Bowhunter Compound' }
        }
    ]
}

const participantNames = ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Wilson', 'Mike Young']

describe('IFAFExcellExporter', () => {
    let processor: IFAFExcellExporter
    let templatePath: string
    let outputPath: string

    beforeEach(() => {
        templatePath = join(process.cwd(), 'resources', 'templatev3.xlsx')
        outputPath = join(process.cwd(), 'test-output-ifaf-excell.xlsx')
        processor = new IFAFExcellExporter(templatePath, mockIFAFBowStyleMappings, mockIFAFAgeGenderMappings)
    })

    afterEach(() => {
        // Clean up test output file
        if (existsSync(outputPath)) {
            unlinkSync(outputPath)
        }
    })

    describe('processTournamentResults', () => {
        it('should process tournament results and return a buffer', async () => {
            const buffer = await processor.processTournamentResults(mockTournamentData)

            expect(buffer).toBeInstanceOf(Buffer)
            expect(buffer.length).toBeGreaterThan(0)
        })

        it('should create a valid Excel file with correct tournament info', async () => {
            const buffer = await processor.processTournamentResults(mockTournamentData)

            // Write buffer to file for inspection
            const fs = await import('fs')
            fs.writeFileSync(outputPath, buffer)

            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.readFile(outputPath)
            const worksheet = workbook.getWorksheet('Results')

            expect(worksheet).toBeDefined()
            if (!worksheet) return

            // Test tournament info
            expect(worksheet.getCell('B8').value).toBe('Test Archery Club') // Host Club
            expect(worksheet.getCell('B9').value).toBe('3D-Standard Round') // Round
            expect(worksheet.getCell('E9').value).toBe(5) // # of competitors
            expect(worksheet.getCell('D10').value).toBe('2024-01-15') // Date
        })

        it('should include all participants with correct age/gender mapping', async () => {
            const buffer = await processor.processTournamentResults(mockTournamentData)

            const fs = await import('fs')
            fs.writeFileSync(outputPath, buffer)

            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.readFile(outputPath)
            const worksheet = workbook.getWorksheet('Results')

            expect(worksheet).toBeDefined()
            if (!worksheet) return

            // Find participant rows by looking for names
            const participantNames = ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Wilson', 'Mike Young']
            let foundParticipants = 0

            worksheet.eachRow({ includeEmpty: false }, (row) => {
                const cellB = row.getCell(2) // Name column
                if (cellB.value && typeof cellB.value === 'string') {
                    if (participantNames.includes(cellB.value.toString())) {
                        foundParticipants++

                        // Verify the row structure: Category, Name, Membership, Club, Score
                        const categoryCell = row.getCell(1)
                        const nameCell = row.getCell(2)
                        const membershipCell = row.getCell(3)
                        const clubCell = row.getCell(4)
                        const scoreCell = row.getCell(5)

                        expect(categoryCell.value).toBeDefined()
                        expect(nameCell.value).toBeDefined()
                        expect(membershipCell.value).toBeDefined()
                        expect(clubCell.value).toBeDefined()
                        expect(scoreCell.value).toBeDefined()
                    }
                }
            })

            expect(foundParticipants).toBe(5)
        })

        it('should have empty rows after bowstyle headers and age/gender groups', async () => {
            const buffer = await processor.processTournamentResults(mockTournamentData)

            const fs = await import('fs')
            fs.writeFileSync(outputPath, buffer)

            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.readFile(outputPath)
            const worksheet = workbook.getWorksheet('Results')

            expect(worksheet).toBeDefined()
            if (!worksheet) return

            let emptyRowsAfterHeaders = 0
            let emptyRowsAfterGroups = 0

            worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const cellA = row.getCell(1)
                const cellB = row.getCell(2)

                // Check for empty rows after bowstyle headers (rows with pattern like "01. Barebow Compound (BB-C)")
                if (cellA.value && typeof cellA.value === 'string') {
                    const match = cellA.value.toString().match(/^(\d{2})\.\s+(.+)\s*\(.*\)?$/)
                    if (match) {
                        // Check if next row is empty
                        const nextRow = worksheet.getRow(rowNumber + 1)
                        if (nextRow && nextRow.getCell(1).value === null && nextRow.getCell(2).value === null) {
                            emptyRowsAfterHeaders++
                        }
                    }
                }

                // Check for empty rows after participant groups
                if (cellB.value && typeof cellB.value === 'string' && participantNames.includes(cellB.value.toString())) {
                    // Check if next row is empty (after last participant in a group)
                    const nextRow = worksheet.getRow(rowNumber + 1)
                    if (nextRow && nextRow.getCell(1).value === null && nextRow.getCell(2).value === null) {
                        emptyRowsAfterGroups++
                    }
                }
            })

            expect(emptyRowsAfterHeaders).toBeGreaterThan(0)
            expect(emptyRowsAfterGroups).toBeGreaterThan(0)
        })

        it('should maintain consistent styling for participant result rows', async () => {
            const buffer = await processor.processTournamentResults(mockTournamentData)

            const fs = await import('fs')
            fs.writeFileSync(outputPath, buffer)

            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.readFile(outputPath)
            const worksheet = workbook.getWorksheet('Results')

            expect(worksheet).toBeDefined()
            if (!worksheet) return

            let participantRowCount = 0
            let consistentStylingCount = 0

            worksheet.eachRow({ includeEmpty: false }, (row) => {
                const cellB = row.getCell(2) // Name column
                if (cellB.value && typeof cellB.value === 'string' && participantNames.includes(cellB.value.toString())) {
                    participantRowCount++

                    // Check if row has consistent styling (non-empty cells in expected columns)
                    const categoryCell = row.getCell(1)
                    const nameCell = row.getCell(2)
                    const membershipCell = row.getCell(3)
                    const clubCell = row.getCell(4)
                    const scoreCell = row.getCell(5)

                    if (categoryCell.value && nameCell.value && membershipCell.value !== undefined && clubCell.value && scoreCell.value !== undefined) {
                        consistentStylingCount++
                    }
                }
            })

            expect(participantRowCount).toBe(5)
            expect(consistentStylingCount).toBe(5)
        })

        it('should sort participants by score (descending) within each age/gender group', async () => {
            const buffer = await processor.processTournamentResults(mockTournamentData)

            const fs = await import('fs')
            fs.writeFileSync(outputPath, buffer)

            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.readFile(outputPath)
            const worksheet = workbook.getWorksheet('Results')

            expect(worksheet).toBeDefined()
            if (!worksheet) return

            // Find Senior Male group (John Smith should be first with score 280)
            let foundSeniorMale = false
            let johnSmithScore = 0

            worksheet.eachRow({ includeEmpty: false }, (row) => {
                const cellB = row.getCell(2)
                const cellE = row.getCell(5)

                if (cellB.value === 'John Smith' && cellE.value) {
                    johnSmithScore = Number(cellE.value)
                    foundSeniorMale = true
                }
            })

            expect(foundSeniorMale).toBe(true)
            expect(johnSmithScore).toBe(280)
        })

        it('should handle participants with null club as "Independent"', async () => {
            const buffer = await processor.processTournamentResults(mockTournamentData)

            const fs = await import('fs')
            fs.writeFileSync(outputPath, buffer)

            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.readFile(outputPath)
            const worksheet = workbook.getWorksheet('Results')

            expect(worksheet).toBeDefined()
            if (!worksheet) return

            let foundIndependent = false

            worksheet.eachRow({ includeEmpty: false }, (row) => {
                const cellB = row.getCell(2)
                const cellD = row.getCell(4) // Club column

                if (cellB.value === 'Bob Johnson' && cellD.value === 'Independent') {
                    foundIndependent = true
                }
            })

            expect(foundIndependent).toBe(true)
        })

        it('should preserve all bowstyle headings from the template', async () => {
            const buffer = await processor.processTournamentResults(mockTournamentData)

            const fs = await import('fs')
            fs.writeFileSync(outputPath, buffer)

            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.readFile(outputPath)
            const worksheet = workbook.getWorksheet('Results')

            expect(worksheet).toBeDefined()
            if (!worksheet) return

            // Expected bowstyle headings from the template (all 12)
            const expectedBowStyleHeadings = [
                '01. Barebow Compound (BB-C)',
                '02. Barebow Recurve (BB-R)',
                '03. Bowhunter Compound (BH-C)',
                '04. Bowhunter Recurve (BH-R)',
                '05. Bowhunter Limited (BL)',
                '06. Bowhunter Unlimited (BU)',
                '07. Freestyle Ltd. Compound (FS-C)',
                '08. Freestyle Ltd. Recurve (FS-R)',
                '09. Freestyle Unlimited (FU)',
                '10. Longbow (LB)',
                '11. Historical Bow (HB)',
                '12. Trad. Recurve (TR)'
            ]

            const foundHeadings: string[] = []

            worksheet.eachRow({ includeEmpty: false }, (row) => {
                const cellA = row.getCell(1)
                if (cellA.value && typeof cellA.value === 'string') {
                    const cellValue = cellA.value.toString().trim()
                    // Check if this matches a bowstyle heading pattern
                    const match = cellValue.match(/^(\d{2})\.\s+(.+)\s*\(.*\)?$/)
                    if (match) {
                        foundHeadings.push(cellValue)
                    }
                }
            })

            // Verify all expected headings are present
            for (const expectedHeading of expectedBowStyleHeadings) {
                expect(foundHeadings).toContain(expectedHeading)
            }

            // Verify we found exactly 12 headings
            expect(foundHeadings).toHaveLength(12)
        })
    })

    describe('data transformation', () => {
        it('should correctly map equipment categories to IFAF bow styles', () => {
            const bbcMapping = mockIFAFBowStyleMappings.find(m => m.equipmentCategoryId === 'BBC')
            expect(bbcMapping).toBeDefined()
            expect(bbcMapping?.ifafBowStyleCode).toBe('BB-C')
            expect(bbcMapping?.ifafBowStyleNumber).toBe('01')
        })

        it('should correctly map age groups and genders to IFAF categories', () => {
            const seniorMaleMapping = mockIFAFAgeGenderMappings.find(m => m.ageGroupId === 'S' && m.genderGroup === 'M')
            expect(seniorMaleMapping).toBeDefined()
            expect(seniorMaleMapping?.ifafCategoryCode).toBe('0')
            expect(seniorMaleMapping?.ifafCategoryName).toBe('Senior Male')
        })
    })
})
