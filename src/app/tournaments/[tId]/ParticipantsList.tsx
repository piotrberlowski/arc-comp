"use client"

import useErrorContext from "@/components/errors/ErrorContext";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { Participant } from "@prisma/client";
import { useCallback, useState, useTransition } from "react";
import CheckInButton from "./components/CheckInButton";
import CSVImport from "./components/CSVImport";
import ParticipantFilter from "./components/ParticipantFilter";
import { listParticipants, removeParticipant } from "./participantActions";
import useTournamentContext from "./TournamentContext";

export default function ParticipantsList({ participants }: { participants: Participant[] }) {
    const [displayP, setDisplayP] = useState(participants)
    const [filteredParticipants, setFilteredParticipants] = useState(participants)
    const [isPending, startTransition] = useTransition()
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; importedCount: number; errors: string[] } | null>(null)
    const tEdit = useTournamentContext()
    const setError = useErrorContext()

    const handleFilteredChange = useCallback((filtered: Participant[]) => {
        setFilteredParticipants(filtered)
    }, [])

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

            <div className="w-full flex" >
                <div className="flex-grow">
                    {/* Filter Section */}
                    <ParticipantFilter
                        participants={displayP}
                        onFilteredChange={handleFilteredChange}
                    />
                </div>
                <div className="hidden md:block md:w-32">
                    <CSVImport onImportComplete={handleImportComplete} />
                </div>
            </div>

            {/* Participants Table */}
            <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
                <table className="table table-zebra">
                    {/* head */}
                    <thead className="w-full bg-primary text-primary-content">
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th className="hidden lg:table-cell">Club</th>
                            <th className="w-50">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="w-full">
                        {
                            filteredParticipants.map(p => (
                                <tr key={`pl-p-${p.id}`}>
                                    <td>
                                        {p.name}
                                    </td>
                                    <td>
                                        {p.ageGroupId}{p.genderGroup}{p.categoryId}
                                    </td>
                                    <td className="hidden lg:table-cell">
                                        {p.club || "Independent"}
                                    </td>
                                    <td className="flex gap-2">
                                        <CheckInButton
                                            participant={p}
                                            onUpdate={async () => {
                                                if (tEdit) {
                                                    try {
                                                        const updatedParticipants = await listParticipants(tEdit.getTournament().id)
                                                        setDisplayP(updatedParticipants)
                                                    } catch (e) {
                                                        setError(e instanceof Error ? e.message : 'Failed to refresh participants')
                                                    }
                                                }
                                            }}
                                            disabled={isPending}
                                        />
                                        <button className="btn btn-error btn-sm" disabled={isPending} onClick={() => startTransition(
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
                                        )}><XCircleIcon className="w-4 h-4" /><span className="hidden md:block">Remove</span></button>
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