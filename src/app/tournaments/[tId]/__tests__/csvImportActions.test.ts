import { GenderGroup } from '@prisma/client'
import { parseCSV } from '../csvImportActions'

describe('CSV Import Parsing', () => {
    const tournamentId = 'test-tournament-id'

    // Mock validation maps based on seed.ts data
    // Age groups: id -> name mapping
    const ageGroupMap = new Map([
        ['C', 'Cub'],
        ['J', 'Junior'],
        ['YA', 'Young Adult'],
        ['A', 'Adult'],
        ['V', 'Veteran'],
        ['S', 'Senior']
    ])

    // Categories: id -> name mapping
    const categoryMap = new Map([
        ['HB', 'Historical Bow'],
        ['LB', 'Longbow'],
        ['TR', 'Traditional Recurve'],
        ['BHR', 'Bowhunter Recurve'],
        ['BHC', 'Bowhunter Compound'],
        ['BU', 'Bowhunter Unlimited'],
        ['BL', 'Bowhunter Limited'],
        ['BBR', 'Barebow Recurve'],
        ['BBC', 'Barebow Compound'],
        ['FSC', 'Freestyle Compound'],
        ['FSR', 'Freestyle Recurve'],
        ['FU', 'Freestyle Unlimited'],
        ['PFAA-ETR', 'PFAA Eastern Thumb Ring / Zekier']
    ])

    const validationMaps = {
        ageGroups: new Set(['C', 'J', 'YA', 'A', 'V', 'S']),
        categories: new Set(['HB', 'LB', 'TR', 'BHR', 'BHC', 'BU', 'BL', 'BBR', 'BBC', 'FSC', 'FSR', 'FU', 'PFAA-ETR']),
        ageGroupMap,
        categoryMap
    }

    describe('parseCSV', () => {
        it('should parse a valid CSV row correctly', async () => {
            const csvText = 'John Doe,12345,M,S,BBC,Archery Club'
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors).toHaveLength(0)
            expect(result.participants).toHaveLength(1)
            expect(result.participants[0]).toEqual({
                tournamentId,
                name: 'John Doe',
                membershipNo: '12345',
                genderGroup: GenderGroup.M,
                ageGroupId: 'S',
                categoryId: 'BBC',
                club: 'Archery Club',
                checkedIn: false
            })
        })

        it('should parse multiple valid rows', async () => {
            const csvText = `John Doe,12345,M,S,BBC,Archery Club
Jane Smith,67890,F,A,FSR,Independent
Bob Johnson,11111,M,V,LB,`

            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors).toHaveLength(0)
            expect(result.participants).toHaveLength(3)
            expect(result.participants[0].name).toBe('John Doe')
            expect(result.participants[1].name).toBe('Jane Smith')
            expect(result.participants[2].name).toBe('Bob Johnson')
            expect(result.participants[2].club).toBeNull()
        })

        it('should handle gender case insensitivity', async () => {
            const csvText = 'John Doe,12345,m,S,BBC,Club'
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors).toHaveLength(0)
            expect(result.participants[0].genderGroup).toBe(GenderGroup.M)
        })

        it('should trim whitespace from values', async () => {
            const csvText = '  John Doe  ,  12345  ,  M  ,  S  ,  BBC  ,  Club  '
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors).toHaveLength(0)
            expect(result.participants[0].name).toBe('John Doe')
            expect(result.participants[0].membershipNo).toBe('12345')
        })

        it('should reject invalid gender', async () => {
            const csvText = 'John Doe,12345,X,S,BBC,Club'
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0].message).toContain('Gender must be')
            expect(result.participants).toHaveLength(0)
        })

        it('should reject missing required fields', async () => {
            const csvText = 'John Doe,,M,S,BBC,Club'
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0].message).toContain('required')
            expect(result.participants).toHaveLength(0)
        })

        it('should reject invalid age group', async () => {
            const csvText = 'John Doe,12345,M,INVALID,BBC,Club'
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0].message).toContain('Age group')
            expect(result.errors[0].message).toContain('not found')
            expect(result.participants).toHaveLength(0)
        })

        it('should reject invalid category', async () => {
            const csvText = 'John Doe,12345,M,S,INVALID,Club'
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0].message).toContain('Equipment category')
            expect(result.errors[0].message).toContain('not found')
            expect(result.participants).toHaveLength(0)
        })

        it('should reject rows with insufficient columns', async () => {
            const csvText = 'John Doe,12345,M,S'
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0].message).toContain('Expected 6 columns')
            expect(result.participants).toHaveLength(0)
        })

        it('should handle empty club field', async () => {
            const csvText = 'John Doe,12345,M,S,BBC,'
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors).toHaveLength(0)
            expect(result.participants[0].club).toBeNull()
        })

        it('should skip empty lines', async () => {
            const csvText = `John Doe,12345,M,S,BBC,Club

Jane Smith,67890,F,A,FSR,Club`
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors).toHaveLength(0)
            expect(result.participants).toHaveLength(2)
        })

        it('should handle all valid age groups from seed data', async () => {
            const ageGroups = ['C', 'J', 'YA', 'A', 'V', 'S']
            const csvText = ageGroups.map((ag, i) =>
                `Person ${i},${1000 + i},M,${ag},BBC,Club`
            ).join('\n')

            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors).toHaveLength(0)
            expect(result.participants).toHaveLength(6)
            ageGroups.forEach((ag, i) => {
                expect(result.participants[i].ageGroupId).toBe(ag)
            })
        })

        it('should handle all valid categories from seed data', async () => {
            const categories = ['HB', 'LB', 'TR', 'BHR', 'BHC', 'BU', 'BL', 'BBR', 'BBC', 'FSC', 'FSR', 'FU']
            const csvText = categories.map((cat, i) =>
                `Person ${i},${1000 + i},M,S,${cat},Club`
            ).join('\n')

            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors).toHaveLength(0)
            expect(result.participants).toHaveLength(categories.length)
            categories.forEach((cat, i) => {
                expect(result.participants[i].categoryId).toBe(cat)
            })
        })

        it('should include row numbers in error messages', async () => {
            const csvText = `John Doe,12345,M,S,BBC,Club
Jane Smith,,F,A,FSR,Club`
            const result = await parseCSV(csvText, tournamentId, validationMaps)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0].message).toContain('Row 2')
            expect(result.participants).toHaveLength(1) // First row is valid
        })

        describe('Gender parsing with "male" and "female"', () => {
            it('should accept "male" (lowercase) for gender', async () => {
                const csvText = 'John Doe,12345,male,S,BBC,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].genderGroup).toBe(GenderGroup.M)
            })

            it('should accept "MALE" (uppercase) for gender', async () => {
                const csvText = 'John Doe,12345,MALE,S,BBC,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].genderGroup).toBe(GenderGroup.M)
            })

            it('should accept "Male" (mixed case) for gender', async () => {
                const csvText = 'John Doe,12345,Male,S,BBC,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].genderGroup).toBe(GenderGroup.M)
            })

            it('should accept "female" (lowercase) for gender', async () => {
                const csvText = 'Jane Smith,67890,female,A,FSR,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].genderGroup).toBe(GenderGroup.F)
            })

            it('should accept "FEMALE" (uppercase) for gender', async () => {
                const csvText = 'Jane Smith,67890,FEMALE,A,FSR,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].genderGroup).toBe(GenderGroup.F)
            })

            it('should accept "Female" (mixed case) for gender', async () => {
                const csvText = 'Jane Smith,67890,Female,A,FSR,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].genderGroup).toBe(GenderGroup.F)
            })

            it('should still accept "M" and "F" for gender', async () => {
                const csvText = `John Doe,12345,M,S,BBC,Club
Jane Smith,67890,F,A,FSR,Club`
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].genderGroup).toBe(GenderGroup.M)
                expect(result.participants[1].genderGroup).toBe(GenderGroup.F)
            })
        })

        describe('Age group parsing by name', () => {
            it('should accept age group by name (lowercase)', async () => {
                const csvText = 'John Doe,12345,M,senior,BBC,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].ageGroupId).toBe('S')
            })

            it('should accept age group by name (uppercase)', async () => {
                const csvText = 'John Doe,12345,M,SENIOR,BBC,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].ageGroupId).toBe('S')
            })

            it('should accept age group by name (mixed case)', async () => {
                const csvText = 'John Doe,12345,M,Senior,BBC,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].ageGroupId).toBe('S')
            })

            it('should accept all age groups by name', async () => {
                const ageGroupNames = ['Cub', 'Junior', 'Young Adult', 'Adult', 'Veteran', 'Senior']
                const csvText = ageGroupNames.map((name, i) =>
                    `Person ${i},${1000 + i},M,${name},BBC,Club`
                ).join('\n')

                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants).toHaveLength(6)
                expect(result.participants[0].ageGroupId).toBe('C')
                expect(result.participants[1].ageGroupId).toBe('J')
                expect(result.participants[2].ageGroupId).toBe('YA')
                expect(result.participants[3].ageGroupId).toBe('A')
                expect(result.participants[4].ageGroupId).toBe('V')
                expect(result.participants[5].ageGroupId).toBe('S')
            })

            it('should still accept age group by ID', async () => {
                const csvText = 'John Doe,12345,M,S,BBC,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].ageGroupId).toBe('S')
            })

            it('should handle "Young Adult" with space correctly', async () => {
                const csvText = 'John Doe,12345,M,young adult,BBC,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].ageGroupId).toBe('YA')
            })
        })

        describe('Category parsing by name', () => {
            it('should accept category by name (lowercase)', async () => {
                const csvText = 'John Doe,12345,M,S,barebow compound,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].categoryId).toBe('BBC')
            })

            it('should accept category by name (uppercase)', async () => {
                const csvText = 'John Doe,12345,M,S,BAREBOW COMPOUND,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].categoryId).toBe('BBC')
            })

            it('should accept category by name (mixed case)', async () => {
                const csvText = 'John Doe,12345,M,S,Barebow Compound,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].categoryId).toBe('BBC')
            })

            it('should accept category with special characters in name', async () => {
                const csvText = 'John Doe,12345,M,S,PFAA Eastern Thumb Ring / Zekier,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].categoryId).toBe('PFAA-ETR')
            })

            it('should accept category name case-insensitively with special characters', async () => {
                const csvText = 'John Doe,12345,M,S,pfaa eastern thumb ring / zekier,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].categoryId).toBe('PFAA-ETR')
            })

            it('should still accept category by ID', async () => {
                const csvText = 'John Doe,12345,M,S,BBC,Club'
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants[0].categoryId).toBe('BBC')
            })

            it('should handle all categories by name', async () => {
                const categoryNames = [
                    'Historical Bow',
                    'Longbow',
                    'Traditional Recurve',
                    'Bowhunter Recurve',
                    'Bowhunter Compound',
                    'Bowhunter Unlimited',
                    'Bowhunter Limited',
                    'Barebow Recurve',
                    'Barebow Compound',
                    'Freestyle Compound',
                    'Freestyle Recurve',
                    'Freestyle Unlimited'
                ]
                const csvText = categoryNames.map((name, i) =>
                    `Person ${i},${1000 + i},M,S,${name},Club`
                ).join('\n')

                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants).toHaveLength(categoryNames.length)
                expect(result.participants[0].categoryId).toBe('HB')
                expect(result.participants[1].categoryId).toBe('LB')
                expect(result.participants[2].categoryId).toBe('TR')
            })
        })

        describe('Combined name and ID usage', () => {
            it('should handle mix of IDs and names in same CSV', async () => {
                const csvText = `John Doe,12345,M,S,BBC,Club
Jane Smith,67890,female,Adult,FSR,Club
Bob Johnson,11111,MALE,V,Longbow,Club`
                const result = await parseCSV(csvText, tournamentId, validationMaps)

                expect(result.errors).toHaveLength(0)
                expect(result.participants).toHaveLength(3)
                expect(result.participants[0].genderGroup).toBe(GenderGroup.M)
                expect(result.participants[0].ageGroupId).toBe('S')
                expect(result.participants[0].categoryId).toBe('BBC')
                expect(result.participants[1].genderGroup).toBe(GenderGroup.F)
                expect(result.participants[1].ageGroupId).toBe('A')
                expect(result.participants[1].categoryId).toBe('FSR')
                expect(result.participants[2].genderGroup).toBe(GenderGroup.M)
                expect(result.participants[2].ageGroupId).toBe('V')
                expect(result.participants[2].categoryId).toBe('LB')
            })
        })
    })
})

