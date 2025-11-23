import { prismaOrThrow } from '@/lib/prisma'
import { join } from 'path'
import { TournamentResultsData } from '../../resultsActions'
import { IFAFExcellExporter } from './ifafExcellExporter'

export async function exportToIFAFXLSX(tournamentData: TournamentResultsData): Promise<Buffer> {
    const templatePath = join(process.cwd(), 'resources', 'templatev3.xlsx')

    // Fetch the required mappings from the database
    const [iFAFBowStyleMappings, iFAFAgeGenderMappings] = await Promise.all([
        prismaOrThrow("get all IFAF bow style mappings").iFAFBowStyleMapping.findMany({
            orderBy: { ifafBowStyleNumber: 'asc' },
            include: { equipmentCategory: true }
        }),
        prismaOrThrow("get all IFAF age gender mappings").iFAFAgeGenderMapping.findMany({
            include: { ageGroup: true }
        })
    ])

    const processor = new IFAFExcellExporter(templatePath, iFAFBowStyleMappings, iFAFAgeGenderMappings)

    return await processor.processTournamentResults(tournamentData)
}
