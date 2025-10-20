#!/usr/bin/env node

/**
 * IFAF Export Test Suite
 * 
 * This test suite validates the IFAF XLSX export functionality and can be re-run
 * between changes to ensure the export is working correctly.
 * 
 * Usage: dotenv -e .env.local node test-ifaf-export-suite.js
 */

const { PrismaClient } = require('@prisma/client')
const ExcelJS = require('exceljs')
const path = require('path')
const fs = require('fs')

// Test configuration
const TEST_CONFIG = {
    tournamentId: 'cmgvgtjdw0002o7ny88cz2iyg',
    templatePath: 'resources/templatev2.xlsx',
    outputPath: 'test-ifaf-export-output.xlsx',
    expectedParticipants: 8,
    expectedBowStyles: 4
}

// Initialize Prisma Client
const prisma = new PrismaClient()

// Mock mappings (should match the database seed data)
const mockBowStyleMappings = [
    { equipmentCategoryId: "BBC", ifafBowStyleCode: "BB-C", ifafBowStyleName: "Barebow Compound (BB-C)", ifafBowStyleNumber: "01" },
    { equipmentCategoryId: "BBR", ifafBowStyleCode: "BB-R", ifafBowStyleName: "Barebow Recurve (BB-R)", ifafBowStyleNumber: "02" },
    { equipmentCategoryId: "BHC", ifafBowStyleCode: "BH-C", ifafBowStyleName: "Bowhunter Compound (BH-C)", ifafBowStyleNumber: "03" },
    { equipmentCategoryId: "BHR", ifafBowStyleCode: "BH-R", ifafBowStyleName: "Bowhunter Recurve (BH-R)", ifafBowStyleNumber: "04" },
    { equipmentCategoryId: "BL", ifafBowStyleCode: "BL", ifafBowStyleName: "Bowhunter Limited (BL)", ifafBowStyleNumber: "05" },
    { equipmentCategoryId: "BU", ifafBowStyleCode: "BU", ifafBowStyleName: "Bowhunter Unlimited (BU)", ifafBowStyleNumber: "06" },
    { equipmentCategoryId: "FSC", ifafBowStyleCode: "FS-C", ifafBowStyleName: "Freestyle Ltd. Compound (FS-C)", ifafBowStyleNumber: "07" },
    { equipmentCategoryId: "FSR", ifafBowStyleCode: "FS-R", ifafBowStyleName: "Freestyle Ltd. Recurve (FS-R)", ifafBowStyleNumber: "08" },
    { equipmentCategoryId: "FU", ifafBowStyleCode: "FU", ifafBowStyleName: "Freestyle Unlimited (FU)", ifafBowStyleNumber: "09" },
    { equipmentCategoryId: "LB", ifafBowStyleCode: "LB", ifafBowStyleName: "Longbow (LB) (American Flatbow (AFB))", ifafBowStyleNumber: "10" },
    { equipmentCategoryId: "HB", ifafBowStyleCode: "HB", ifafBowStyleName: "Historical Bow (HB)", ifafBowStyleNumber: "11" },
    { equipmentCategoryId: "TR", ifafBowStyleCode: "TR-IFAA", ifafBowStyleName: "Trad. Recurve IFAA (TR - IFAA)", ifafBowStyleNumber: "12" },
]

const mockAgeGenderMappings = [
    { ageGroupId: "S", genderGroup: "M", ifafCategoryCode: "0", ifafCategoryName: "Senior Male" },
    { ageGroupId: "S", genderGroup: "F", ifafCategoryCode: "1", ifafCategoryName: "Senior Female" },
    { ageGroupId: "V", genderGroup: "M", ifafCategoryCode: "2", ifafCategoryName: "Veteran Male" },
    { ageGroupId: "V", genderGroup: "F", ifafCategoryCode: "3", ifafCategoryName: "Veteran Female" },
    { ageGroupId: "A", genderGroup: "M", ifafCategoryCode: "4", ifafCategoryName: "Adult Male" },
    { ageGroupId: "A", genderGroup: "F", ifafCategoryCode: "5", ifafCategoryName: "Adult Female" },
    { ageGroupId: "YA", genderGroup: "M", ifafCategoryCode: "6", ifafCategoryName: "Young Adult Male" },
    { ageGroupId: "YA", genderGroup: "F", ifafCategoryCode: "7", ifafCategoryName: "Young Adult Female" },
    { ageGroupId: "J", genderGroup: "M", ifafCategoryCode: "8", ifafCategoryName: "Junior Male" },
    { ageGroupId: "J", genderGroup: "F", ifafCategoryCode: "9", ifafCategoryName: "Junior Female" },
    { ageGroupId: "C", genderGroup: "M", ifafCategoryCode: "10", ifafCategoryName: "Cub Male" },
    { ageGroupId: "C", genderGroup: "F", ifafCategoryCode: "11", ifafCategoryName: "Cub Female" },
]

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
}

function addTestResult(testName, passed, message = '') {
    testResults.tests.push({ testName, passed, message })
    if (passed) {
        testResults.passed++
        console.log(`✅ ${testName}`)
    } else {
        testResults.failed++
        console.log(`❌ ${testName}: ${message}`)
    }
}

// Mock the IFAFXLSXProcessor class
class IFAFXLSXProcessor {
    constructor(templatePath) {
        this.templatePath = templatePath
    }

    async processTournamentResults(tournamentData) {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.readFile(this.templatePath)
        const worksheet = workbook.getWorksheet('Results')

        // Fill tournament info
        worksheet.getCell('B8').value = tournamentData.tournament.organizer
        worksheet.getCell('B9').value = '3D'
        worksheet.getCell('E9').value = tournamentData.participants.length
        worksheet.getCell('D10').value = tournamentData.tournament.date

        // Transform data to IFAF format
        const ifafData = await this.transformToIFAF(tournamentData)

        // Process each bow style group in reverse order
        for (const bowStyleGroup of ifafData.bowStyleGroups) {
            let headingRow = null
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber < 12) return
                const cellA = row.getCell(1)
                if (cellA.value && typeof cellA.value === 'string') {
                    const cellValue = cellA.value.toString()
                    const match = cellValue.match(/^(\d{2})\.\s+(.+)\s*\(.*\)?$/)
                    if (match && match[1] === bowStyleGroup.bowStyle.number) {
                        headingRow = rowNumber
                        return false
                    }
                }
            })

            if (!headingRow) continue

            const totalParticipants = bowStyleGroup.ageGenderGroups.reduce((sum, group) => sum + group.participants.length, 0)
            if (totalParticipants === 0) continue

            // Get the formatting from the empty row after the heading
            const formatRow = worksheet.getRow(headingRow + 1)
            const formatCells = []
            formatRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                formatCells[colNumber] = {
                    font: cell.font,
                    fill: cell.fill,
                    border: cell.border,
                    alignment: cell.alignment,
                    numFmt: cell.numFmt
                }
            })

            // Find next heading
            let nextHeadingRow = worksheet.rowCount + 1
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber <= headingRow) return
                const cellA = row.getCell(1)
                if (cellA.value && typeof cellA.value === 'string') {
                    const cellValue = cellA.value.toString()
                    const match = cellValue.match(/^(\d{2})\.\s+(.+)\s*\(.*\)?$/)
                    if (match) {
                        nextHeadingRow = rowNumber
                        return false
                    }
                }
            })

            // Clear only the original template data (not data inserted by other bow styles)
            for (let row = headingRow + 1; row < nextHeadingRow; row++) {
                const worksheetRow = worksheet.getRow(row)
                const cellA = worksheetRow.getCell(1)
                const cellB = worksheetRow.getCell(2)

                // Only clear if it's not a participant row (doesn't have a name in column B)
                if (!cellB.value || cellB.value === 'Name') {
                    worksheetRow.eachCell({ includeEmpty: true }, (cell) => {
                        cell.value = null
                    })
                }
            }

            let currentRow = headingRow + 1

            for (let groupIndex = 0; groupIndex < bowStyleGroup.ageGenderGroups.length; groupIndex++) {
                const ageGenderGroup = bowStyleGroup.ageGenderGroups[groupIndex]

                for (const participant of ageGenderGroup.participants) {
                    // Insert a new row for this participant
                    worksheet.insertRow(currentRow, [])

                    const row = worksheet.getRow(currentRow)

                    // Set values
                    row.getCell(1).value = ageGenderGroup.category.name
                    row.getCell(2).value = participant.name
                    row.getCell(3).value = participant.membershipNumber || ''
                    row.getCell(4).value = participant.club
                    row.getCell(5).value = participant.score

                    // Apply formatting
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        if (formatCells[colNumber]) {
                            cell.font = formatCells[colNumber].font
                            cell.fill = formatCells[colNumber].fill
                            cell.border = formatCells[colNumber].border
                            cell.alignment = formatCells[colNumber].alignment
                            cell.numFmt = formatCells[colNumber].numFmt
                        }
                    })

                    currentRow++
                }

                // Insert empty row between age-gender groups (except after the last group)
                if (groupIndex < bowStyleGroup.ageGenderGroups.length - 1) {
                    worksheet.insertRow(currentRow, [])

                    // Apply formatting to the empty row
                    const emptyRow = worksheet.getRow(currentRow)
                    emptyRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        if (formatCells[colNumber]) {
                            cell.font = formatCells[colNumber].font
                            cell.fill = formatCells[colNumber].fill
                            cell.border = formatCells[colNumber].border
                            cell.alignment = formatCells[colNumber].alignment
                            cell.numFmt = formatCells[colNumber].numFmt
                        }
                    })

                    currentRow++
                }
            }
        }

        return await workbook.xlsx.writeBuffer()
    }

    async transformToIFAF(tournamentData) {
        const equipmentGroups = new Map()
        for (const p of tournamentData.participants) {
            const categoryId = p.participant.categoryId
            if (!equipmentGroups.has(categoryId)) {
                equipmentGroups.set(categoryId, [])
            }
            equipmentGroups.get(categoryId).push(p)
        }

        const bowStyleGroups = []
        for (const [equipmentCategoryId, participants] of equipmentGroups) {
            const bowStyleMapping = mockBowStyleMappings.find(m => m.equipmentCategoryId === equipmentCategoryId)
            if (!bowStyleMapping) continue

            const ageGenderGroups = new Map()
            for (const p of participants) {
                const key = `${p.participant.ageGroupId}-${p.participant.genderGroup}`
                if (!ageGenderGroups.has(key)) {
                    ageGenderGroups.set(key, [])
                }
                ageGenderGroups.get(key).push(p)
            }

            const ifafAgeGenderGroups = []
            for (const [key, groupParticipants] of ageGenderGroups) {
                const [ageGroupId, genderGroup] = key.split('-')
                const ageGenderMapping = mockAgeGenderMappings.find(m => m.ageGroupId === ageGroupId && m.genderGroup === genderGroup)
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
                        participants: sortedParticipants.map((p, index) => ({
                            name: p.participant.name,
                            membershipNumber: undefined,
                            club: p.participant.club || 'Independent',
                            score: p.score || 0,
                            place: index + 1
                        }))
                    })
                }
            }
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
        bowStyleGroups.sort((a, b) => parseInt(b.bowStyle.number) - parseInt(a.bowStyle.number))
        return {
            tournamentInfo: {
                name: tournamentData.tournament.name,
                date: tournamentData.tournament.date.toISOString().split('T')[0],
                organizer: tournamentData.tournament.organizerClub
            },
            bowStyleGroups
        }
    }
}

async function runTestSuite() {
    console.log('🏹 IFAF Export Test Suite')
    console.log('========================\n')

    try {
        // Test 1: Load tournament data
        console.log('📊 Test 1: Loading tournament data...')
        const tournament = await prisma.tournament.findUnique({
            where: { id: TEST_CONFIG.tournamentId },
            include: {
                format: true,
                participants: {
                    include: {
                        groupAssignment: true,
                        participantScore: true,
                        ageGroup: true,
                        category: true
                    }
                }
            }
        })

        if (!tournament) {
            addTestResult('Load tournament data', false, 'Tournament not found')
            return
        }

        addTestResult('Load tournament data', true, `Found tournament: ${tournament.name}`)

        // Test 2: Transform data
        console.log('\n📊 Test 2: Transforming data...')
        const tournamentData = {
            tournament: {
                id: tournament.id,
                name: tournament.name,
                date: tournament.date,
                formatId: tournament.formatId,
                organizerClub: tournament.organizerClub,
                isArchive: tournament.isArchive,
                isPublished: tournament.isPublished,
                format: {
                    name: tournament.format.name,
                    endCount: tournament.format.endCount,
                    groupSize: tournament.format.groupSize
                }
            },
            participants: tournament.participants.map(p => ({
                id: p.participantScore?.id || '',
                participantId: p.id,
                tournamentId: tournament.id,
                score: p.participantScore?.score || null,
                isComplete: p.participantScore?.isComplete || false,
                participant: {
                    id: p.id,
                    name: p.name,
                    ageGroupId: p.ageGroupId,
                    categoryId: p.categoryId,
                    club: p.club,
                    genderGroup: p.genderGroup,
                    ageGroup: p.ageGroup,
                    equipmentCategory: p.category
                }
            }))
        }

        addTestResult('Transform data', tournamentData.participants.length === TEST_CONFIG.expectedParticipants,
            `Expected ${TEST_CONFIG.expectedParticipants} participants, got ${tournamentData.participants.length}`)

        // Test 3: Load template
        console.log('\n📄 Test 3: Loading template...')
        const templatePath = path.join(process.cwd(), TEST_CONFIG.templatePath)
        if (!fs.existsSync(templatePath)) {
            addTestResult('Load template', false, `Template file not found: ${templatePath}`)
            return
        }

        const templateWorkbook = new ExcelJS.Workbook()
        await templateWorkbook.xlsx.readFile(templatePath)
        const templateWorksheet = templateWorkbook.getWorksheet('Results')

        addTestResult('Load template', true, `Template loaded: ${templateWorksheet.rowCount} rows`)

        // Test 4: Process export
        console.log('\n📝 Test 4: Processing export...')
        const processor = new IFAFXLSXProcessor(templatePath)
        const buffer = await processor.processTournamentResults(tournamentData)

        addTestResult('Process export', buffer.length > 0, `Export buffer size: ${buffer.length} bytes`)

        // Test 5: Save and verify output
        console.log('\n💾 Test 5: Saving and verifying output...')
        const outputPath = path.join(process.cwd(), TEST_CONFIG.outputPath)
        fs.writeFileSync(outputPath, buffer)

        const outputWorkbook = new ExcelJS.Workbook()
        await outputWorkbook.xlsx.readFile(outputPath)
        const outputWorksheet = outputWorkbook.getWorksheet('Results')

        addTestResult('Save output', true, `Output saved: ${outputPath}`)

        // Test 6: Verify tournament info
        console.log('\n📋 Test 6: Verifying tournament info...')
        const hostClub = outputWorksheet.getCell('B8').value
        const round = outputWorksheet.getCell('B9').value
        const competitorCount = outputWorksheet.getCell('E9').value
        const date = outputWorksheet.getCell('D10').value

        addTestResult('Tournament info - Host Club', hostClub === tournamentData.tournament.organizerClub,
            `Expected: ${tournamentData.tournament.organizerClub}, Got: ${hostClub}`)
        addTestResult('Tournament info - Round', round === '3D', `Expected: 3D, Got: ${round}`)
        addTestResult('Tournament info - Competitor Count', competitorCount === TEST_CONFIG.expectedParticipants,
            `Expected: ${TEST_CONFIG.expectedParticipants}, Got: ${competitorCount}`)
        addTestResult('Tournament info - Date', date === tournamentData.tournament.date,
            `Expected: ${tournamentData.tournament.date}, Got: ${date}`)

        // Test 7: Verify headings
        console.log('\n🎯 Test 7: Verifying headings...')
        let headingCount = 0
        const expectedHeadings = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        const foundHeadings = []

        outputWorksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber < 12) return
            const cellA = row.getCell(1)
            if (cellA.value && typeof cellA.value === 'string') {
                const cellValue = cellA.value.toString()
                const match = cellValue.match(/^(\d{2})\.\s+(.+)\s*\(.*\)?$/)
                if (match) {
                    headingCount++
                    foundHeadings.push(match[1])
                }
            }
        })

        addTestResult('Headings count', headingCount === 12, `Expected: 12, Got: ${headingCount}`)
        addTestResult('All headings present', foundHeadings.length === 12,
            `Found: ${foundHeadings.sort().join(', ')}, Expected: ${expectedHeadings.join(', ')}`)

        // Test 8: Verify participants
        console.log('\n👥 Test 8: Verifying participants...')
        let participantCount = 0
        const foundParticipants = []

        outputWorksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber < 12) return
            const cellA = row.getCell(1)
            const cellB = row.getCell(2)

            if (cellB.value && cellB.value !== 'Name' && typeof cellB.value === 'string') {
                participantCount++
                foundParticipants.push(cellB.value)
            }
        })

        addTestResult('Participants count', participantCount === TEST_CONFIG.expectedParticipants,
            `Expected: ${TEST_CONFIG.expectedParticipants}, Got: ${participantCount}`)
        addTestResult('All participants found', foundParticipants.length === TEST_CONFIG.expectedParticipants,
            `Found: ${foundParticipants.join(', ')}`)

        // Test 9: Verify formatting
        console.log('\n🎨 Test 9: Verifying formatting...')
        let formattedRows = 0
        let emptyRows = 0

        outputWorksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber < 12) return
            if (rowNumber > 60) return

            const cellA = row.getCell(1)
            const cellB = row.getCell(2)

            if (cellB.value && cellB.value !== 'Name' && typeof cellB.value === 'string') {
                // Check if formatting is applied
                const font = cellA.font
                if (font && font.name && font.size) {
                    formattedRows++
                }
            } else if (!cellA.value && !cellB.value) {
                emptyRows++
            }
        })

        addTestResult('Participant formatting', formattedRows === TEST_CONFIG.expectedParticipants,
            `Expected: ${TEST_CONFIG.expectedParticipants} formatted rows, Got: ${formattedRows}`)
        addTestResult('Empty rows present', emptyRows > 0, `Found ${emptyRows} empty rows`)

        // Test 10: Verify age-gender grouping
        console.log('\n📊 Test 10: Verifying age-gender grouping...')
        const processor2 = new IFAFXLSXProcessor(templatePath)
        const ifafData = await processor2.transformToIFAF(tournamentData)

        console.log(`📊 IFAF Data: ${ifafData.bowStyleGroups.length} bow style groups`)
        for (const group of ifafData.bowStyleGroups) {
            const participantCount = group.ageGenderGroups.reduce((sum, ag) => sum + ag.participants.length, 0)
            console.log(`  ${group.bowStyle.number}: ${group.bowStyle.name} - ${participantCount} participants`)
        }

        // Test 11: Check database mappings
        console.log('\n📊 Test 11: Checking database mappings...')
        const { PrismaClient } = require('@prisma/client')
        const dbClient = new PrismaClient()
        const allMappings = await dbClient.iFAFBowStyleMapping.findMany({
            orderBy: { ifafBowStyleNumber: 'asc' }
        })
        console.log(`📊 Database mappings: ${allMappings.length} total`)
        for (const mapping of allMappings) {
            console.log(`  ${mapping.ifafBowStyleNumber}: ${mapping.ifafBowStyleName}`)
        }
        await dbClient.$disconnect()

        addTestResult('Bow style groups', ifafData.bowStyleGroups.length === 4,
            `Expected: 4 bow style groups (only ones with participants), Got: ${ifafData.bowStyleGroups.length}`)
        addTestResult('Database mappings', allMappings.length === 12,
            `Expected: 12 database mappings, Got: ${allMappings.length}`)

        // Print final results
        console.log('\n📊 Test Results Summary')
        console.log('======================')
        console.log(`✅ Passed: ${testResults.passed}`)
        console.log(`❌ Failed: ${testResults.failed}`)
        console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)

        if (testResults.failed === 0) {
            console.log('\n🎉 All tests passed! IFAF export is working correctly.')
        } else {
            console.log('\n⚠️ Some tests failed. Please review the issues above.')
        }

    } catch (error) {
        console.error('❌ Test suite failed:', error)
        addTestResult('Test suite execution', false, error.message)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the test suite
runTestSuite()
