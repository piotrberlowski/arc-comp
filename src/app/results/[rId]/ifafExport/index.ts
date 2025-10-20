import { join } from 'path'
import { TournamentResultsData } from '../resultsActions'
import { IFAFXLSXProcessor } from './xlsxProcessor'

export async function exportToIFAFXLSX(tournamentData: TournamentResultsData): Promise<Buffer> {
    const templatePath = join(process.cwd(), 'resources', 'templatev2.xlsx')
    const processor = new IFAFXLSXProcessor(templatePath)

    return await processor.processTournamentResults(tournamentData)
}
