"use client"

import useErrorContext from "@/components/errors/ErrorContext";
import { Participant } from "@/generated/prisma/browser"
import { applyParticipantListView, type ParticipantSortKey } from "@/lib/participantListView"
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import useTournamentContext from "./TournamentContext";
import CSVImport from "./components/CSVImport"
import ParticipantFilter, { createParticipantFilter, useCheckInFilter } from "./components/ParticipantFilter";
import ParticipantViewControls from "./components/ParticipantViewControls"
import { listParticipants, removeParticipant } from "./participantActions"
import ParticipantsListRow from "./ParticipantsListRow"

interface ParticipantsListProps {
    participants: Participant[]
    allowImportAndEdit?: boolean
    onEditParticipant?: (participant: Participant | null) => void
    editingParticipantId?: string | null
}

export default function ParticipantsList({
    participants,
    allowImportAndEdit = true,
    onEditParticipant,
    editingParticipantId,
}: ParticipantsListProps) {
    const [importFeedback, setImportFeedback] = useState<string | null>(null)
    const [displayP, setDisplayP] = useState(participants)
    const [nameQuery, setNameQuery] = useState("")
    const [sortKey, setSortKey] = useState<ParticipantSortKey>("name")
    const { checkInFilter, setCheckInFilter } = useCheckInFilter()
    const [isPending, startTransition] = useTransition()
    const visibleParticipants = useMemo(() => {
        const byStatus = displayP.filter(createParticipantFilter(checkInFilter))
        return applyParticipantListView(byStatus, nameQuery, sortKey)
    }, [displayP, checkInFilter, nameQuery, sortKey])
    const tEdit = useTournamentContext()
    const setError = useErrorContext()

    useEffect(() => {
        if (!importFeedback) return
        const id = setTimeout(() => setImportFeedback(null), 8000)
        return () => clearTimeout(id)
    }, [importFeedback])

    const handleImportComplete = useCallback(async (result: { success: boolean; message: string; importedCount: number; errors: string[] }) => {
        if (result.success && tEdit) {
            // Refresh the participants list
            try {
                const updatedParticipants = await listParticipants(tEdit.getTournament().id)
                setDisplayP(updatedParticipants)
                const summary =
                    result.message.trim() ||
                    (result.importedCount > 0
                        ? `Imported ${result.importedCount} participant${result.importedCount === 1 ? "" : "s"}.`
                        : "Import completed.")
                setImportFeedback(summary)
            } catch (error) {
                console.error("Failed to refresh participants:", error)
                setError(error instanceof Error ? error.message : 'Failed to refresh participants')
            }
        }
    }, [tEdit, setError])

    const refreshParticipants = useCallback(async () => {
        if (!tEdit) return
        try {
            const updatedParticipants = await listParticipants(tEdit.getTournament().id)
            setDisplayP(updatedParticipants)
        } catch (e) {
            console.error("Failed to refresh participants:", e)
            setError(e instanceof Error ? e.message : 'Failed to refresh participants')
        }
    }, [tEdit, setError])

    const handleRemoveParticipant = useCallback(
        (p: Participant) => {
            startTransition(() =>
                removeParticipant(p.id)
                    .then(() => setDisplayP((prev) => prev.filter((listedP) => listedP != p)))
                    .catch((e) => {
                        console.error("Failed to remove participant:", e)
                        if (tEdit) {
                            listParticipants(tEdit.getTournament().id).then((tP) => setDisplayP(tP))
                        }
                        setError(e)
                    })
            )
        },
        [tEdit, setError]
    )

    return (
        <div className="md:w-4/5 mx-auto space-y-6">
            {importFeedback && (
                <div role="status" className="alert alert-success shadow-sm">
                    <span>{importFeedback}</span>
                    <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => setImportFeedback(null)}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="w-full flex gap-2 items-start" >
                <div className="grow">
                    <ParticipantViewControls
                        nameQuery={nameQuery}
                        onNameQueryChange={setNameQuery}
                        sortKey={sortKey}
                        onSortChange={setSortKey}
                    >
                        <ParticipantFilter
                            filter={checkInFilter}
                            onFilterChange={setCheckInFilter}
                        />
                        <span className="text-sm text-base-content/70 hidden md:block whitespace-nowrap">
                            Showing {visibleParticipants.length} of {displayP.length}
                        </span>
                    </ParticipantViewControls>
                </div>
                <div className="hidden md:block md:w-32">
                    {allowImportAndEdit ? <CSVImport onImportComplete={handleImportComplete} /> : null}
                </div>
            </div>

            {/* Participants Table */}
            <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
                <table className="table table-zebra">
                    {/* head */}
                    <thead className="w-full bg-primary text-primary-content">
                        <tr>
                            <th>Name</th>
                            <th className="hidden sm:table-cell">Membership No</th>
                            <th>Category</th>
                            <th className="hidden md:table-cell">Club</th>
                            <th className="w-50">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="w-full">
                        {visibleParticipants.map((p) => (
                            <ParticipantsListRow
                                key={`pl-p-${p.id}`}
                                participant={p}
                                isPending={isPending}
                                editingParticipantId={editingParticipantId}
                                onEditParticipant={onEditParticipant}
                                onRefreshParticipants={refreshParticipants}
                                onRemoveParticipant={handleRemoveParticipant}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}