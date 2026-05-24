"use client"

import ParticipantCSVImport from "@/components/participants/ParticipantCSVImport"
import type { CSVImportState } from "@/lib/participantCsvImport"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { importChampionshipRegistrationsCSV } from "./championshipCsvImportActions"
import ChampionshipRosterList, { type ChampionshipRegistrationRow } from "./ChampionshipRosterList"
import RegisterChampionshipCompetitorForm from "./RegisterChampionshipCompetitorForm"
import { ErrorContextProvider } from "@/components/errors/ErrorContext"

export default function ChampionshipRosterSection({
    championshipId,
    registrations,
    readOnly = false,
}: {
    championshipId: string
    registrations: ChampionshipRegistrationRow[]
    readOnly?: boolean
}) {
    const router = useRouter()

    const handleImportComplete = useCallback((result: CSVImportState) => {
        if (result.success) {
            router.refresh()
        }
    }, [router])

    return (
        <ErrorContextProvider>
            <section className="mt-8">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg font-medium">Competitor roster</h2>
                    {!readOnly ? (
                        <ParticipantCSVImport
                            drawerId={`championship-csv-import-${championshipId}`}
                            entityId={championshipId}
                            entityIdFieldName="championshipId"
                            importAction={importChampionshipRegistrationsCSV}
                            permalink={`/championships/${championshipId}`}
                            title="Import Competitors"
                            submitLabel="Import Competitors"
                            onImportComplete={handleImportComplete}
                        />
                    ) : null}
                </div>
                {!readOnly ? <RegisterChampionshipCompetitorForm championshipId={championshipId} /> : null}
                <div className={readOnly ? "" : "mt-4"}>
                    <ChampionshipRosterList
                        championshipId={championshipId}
                        registrations={registrations}
                        readOnly={readOnly}
                    />
                </div>
            </section>
        </ErrorContextProvider>
    )
}
