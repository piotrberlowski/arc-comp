"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import ParticipantCSVImport from "@/components/participants/ParticipantCSVImport"
import type { CSVImportState } from "@/lib/participantCsvImport"
import type {
    ChampionshipEnrollmentEligibility,
    ChampionshipEnrollmentSlot,
    ChampionshipRosterDayColumn,
} from "@/lib/championshipEnrollment"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { importChampionshipRegistrationsCSV } from "./championshipCsvImportActions"
import ChampionshipRosterList, { type ChampionshipRegistrationRow } from "./ChampionshipRosterList"
import EditChampionshipCompetitorForm from "./EditChampionshipCompetitorForm"
import RegisterChampionshipCompetitorForm from "./RegisterChampionshipCompetitorForm"

export default function ChampionshipRosterSection({
    championshipId,
    registrations,
    rosterDays,
    enrollmentByMembership,
    enrollmentEligibility,
    assignmentsComplete,
    rangeCount,
    readOnly = false,
}: {
    championshipId: string
    registrations: ChampionshipRegistrationRow[]
    rosterDays: ChampionshipRosterDayColumn[]
    enrollmentByMembership: Record<string, ChampionshipEnrollmentSlot[]>
    enrollmentEligibility: ChampionshipEnrollmentEligibility
    assignmentsComplete: boolean
    rangeCount: number
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
        <div className="space-y-4">
            {!readOnly ? (
                <div className="flex flex-wrap justify-end">
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
                </div>
            ) : null}
            {!readOnly ? <RegisterChampionshipCompetitorForm championshipId={championshipId} /> : null}
            <ChampionshipRosterList
                championshipId={championshipId}
                registrations={registrations}
                rosterDays={rosterDays}
                enrollmentByMembership={enrollmentByMembership}
                enrollmentEligibility={enrollmentEligibility}
                assignmentsComplete={assignmentsComplete}
                rangeCount={rangeCount}
                readOnly={readOnly}
                onEditRegistration={readOnly ? undefined : handleEditRegistration}
            />
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
        </div>
    )
}
