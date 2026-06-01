import { getChampionshipCombinedIfafExportData } from "@/app/championships/championshipActions"
import { exportIfafXlsx } from "@/app/results/[rId]/ifafExport"
import { getChampionshipOrganizerClubs } from "@/lib/championshipOrganizerScope"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../auth"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { championshipId } = await request.json()
        if (!championshipId || typeof championshipId !== "string") {
            return NextResponse.json({ error: "Championship ID required" }, { status: 400 })
        }

        const clubs = getChampionshipOrganizerClubs(session.organizerRoles)
        const exportData = await getChampionshipCombinedIfafExportData(championshipId, clubs)
        if (!exportData) {
            return NextResponse.json({ error: "Export not available" }, { status: 400 })
        }

        const buffer = await exportIfafXlsx(exportData)

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${exportData.fileNameStem ?? "championship"}-IFAF-Combined.xlsx"`,
            },
        })
    } catch (error) {
        console.error("IFAF combined export error:", error)
        return NextResponse.json({ error: "Export failed" }, { status: 500 })
    }
}
