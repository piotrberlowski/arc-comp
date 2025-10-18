"use client"

import useErrorContext from "@/components/errors/ErrorContext";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { Participant } from "@prisma/client";
import { useState, useTransition } from "react";
import CSVImport from "./components/CSVImport";
import { listParticipants, removeParticipant } from "./participantActions";
import useTournamentContext from "./TournamentContext";

export default function ParticipantsList({ participants }: { participants: Participant[] }) {
    const [displayP, setDisplayP] = useState(participants)
    const [isPending, startTransition] = useTransition()
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; importedCount: number; errors: string[] } | null>(null)
    const tEdit = useTournamentContext()
    const setError = useErrorContext()

    const handleImportComplete = async (result: { success: boolean; message: string; importedCount: number; errors: string[] }) => {
        setImportResult(result)

        if (result.success && tEdit) {
            // Refresh the participants list
            try {
                const updatedParticipants = await listParticipants(tEdit.getTournament().id)
                setDisplayP(updatedParticipants)
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Failed to refresh participants')
            }
        }
    }

    return (
        <div className="w-4/5 mx-auto space-y-6">
            {/* CSV Import Section */}
            <CSVImport onImportComplete={handleImportComplete} />

            {/* Import Result Display */}
            {importResult && (
                <div className={`alert ${importResult.success ? 'alert-success' : 'alert-error'}`}>
                    <div>
                        <h4 className="font-bold">{importResult.success ? 'Import Successful' : 'Import Failed'}</h4>
                        <div className="text-sm">{importResult.message}</div>
                        {importResult.errors.length > 0 && (
                            <div className="mt-2">
                                <details className="collapse collapse-arrow">
                                    <summary className="collapse-title text-sm">View Errors ({importResult.errors.length})</summary>
                                    <div className="collapse-content">
                                        <ul className="list-disc list-inside text-xs space-y-1">
                                            {importResult.errors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Participants Table */}
            <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
                <table className="table table-zebra">
                    {/* head */}
                    <thead className="w-full bg-primary text-primary-content">
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Club</th>
                            <th className="w-50">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="w-full">
                        {
                            displayP.map(p => (
                                <tr key={`pl-p-${p.id}`}>
                                    <td>
                                        {p.name}
                                    </td>
                                    <td>
                                        {p.ageGroupId}{p.genderGroup}{p.categoryId}
                                    </td>
                                    <td>
                                        {p.club || "Independent"}
                                    </td>
                                    <td className="flex gap-2">
                                        <button className="btn btn-error btn-sm w-23" disabled={isPending} onClick={() => startTransition(
                                            () => removeParticipant(p.id)
                                                .then(
                                                    () => setDisplayP(displayP.filter(listedP => listedP != p))
                                                )
                                                .catch(
                                                    e => {
                                                        if (tEdit) {
                                                            listParticipants(tEdit.getTournament().id).then(tP => setDisplayP(tP))
                                                        }
                                                        setError(e)
                                                    }
                                                )
                                        )}><XCircleIcon width={24} />Remove</button>
                                    </td>
                                </tr>
                            )
                            )
                        }

                    </tbody>
                </table>
            </div>
        </div>
    )
}