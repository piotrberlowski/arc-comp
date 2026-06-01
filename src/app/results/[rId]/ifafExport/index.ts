import { TournamentResultsData } from '../../resultsActions'
import { ifafExportDataFromTournament } from './ifafExportMappers'
import type { IfafExportData } from './ifafExportTypes'
import { loadIfafExporter } from './loadIfafExporter'

export type { IfafExportData, IfafExportParticipant } from './ifafExportTypes'

export async function exportIfafXlsx(exportData: IfafExportData): Promise<Buffer> {
    const processor = await loadIfafExporter()
    return processor.processExportData(exportData)
}

export async function exportToIFAFXLSX(tournamentData: TournamentResultsData): Promise<Buffer> {
    return exportIfafXlsx(ifafExportDataFromTournament(tournamentData))
}
