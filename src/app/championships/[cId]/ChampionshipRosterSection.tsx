"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import ParticipantCSVImport from "@/components/participants/ParticipantCSVImport"
import type { CSVImportState } from "@/lib/participantCsvImport"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { importChampionshipRegistrationsCSV } from "./championshipCsvImportActions"
import ChampionshipRosterList, {
    type ChampionshipRegistrationRow,
    type ChampionshipRosterDayColumn,
} from "./ChampionshipRosterList"
import EditChampionshipCompetitorForm from "./EditChampionshipCompetitorForm"
import RegisterChampionshipCompetitorForm from "./RegisterChampionshipCompetitorForm"
import { ErrorContextProvider } from "@/components/errors/ErrorContext"

export default function ChampionshipRosterSection({
    championshipId,
    registrations,
    days,
    enrollmentByMembership,
    readOnly = false,
}: {
    championshipId: string
    registrations: ChampionshipRegistrationRow[]
    days: ChampionshipRosterDayColumn[]
    enrollmentByMembership: Record<string, number[]>
    readOnly?: boolean
}) {
    const router = useRouter()
    const editModalRef = useRef<FormModalHandle>(null)
    const [editingRegistration, setEditingRegistration] = useState<ChampionshipRegistrationRow | null>(null)

    const handleImportComplete = useCallback((result: CSVImportState) => {
        if (result.success) {
            router.refresh()
        }
    }, [router])

    const handleEditRegistration = useCallback((registration: ChampionshipRegistrationRow) => {
        setEditingRegistration(registration)
        editModalRef.current?.open()
    }, [])

    const closeEditModal = useCallback(() => {
        editModalRef.current?.close()
    }, [])

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
                        days={days}
                        enrollmentByMembership={enrollmentByMembership}
                        readOnly={readOnly}
                        onEditRegistration={readOnly ? undefined : handleEditRegistration}
                    />
                </div>
                {!readOnly ? (
                    <FormModal ref={editModalRef}>
                        {editingRegistration ? (
                            <EditChampionshipCompetitorForm
                                championshipId={championshipId}
                                registration={editingRegistration}
                                onClose={closeEditModal}
                            />
                        ) : null}
                    </FormModal>
                ) : null}
            </section>
        </ErrorContextProvider>
    )
}
