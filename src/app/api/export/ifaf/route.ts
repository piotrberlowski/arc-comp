import { NextRequest, NextResponse } from 'next/server'
import { exportToIFAFXLSX } from '../../../results/[rId]/ifafExport'
import { getTournamentResults } from '../../../results/[rId]/resultsActions'

export async function POST(request: NextRequest) {
    try {
        const { tournamentId } = await request.json()

        if (!tournamentId) {
            return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 })
        }

        const tournamentData = await getTournamentResults(tournamentId)
        const buffer = await exportToIFAFXLSX(tournamentData)

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${tournamentData.tournament.name}-IFAF-Results.xlsx"`
            }
        })
    } catch (error) {
        console.error('IFAF export error:', error)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}
