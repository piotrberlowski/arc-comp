"use client"

import useErrorContext from "@/components/errors/ErrorContext";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { Participant } from "@prisma/client";
import { useState, useTransition } from "react";
import { listParticipants, removeParticipant } from "./participantActions";
import useTournamentContext from "./TournamentContext";

export default function ParticipantsList({ participants }: { participants: Participant[] }) {
    const [displayP, setDisplayP] = useState(participants)
    const [isPending, startTransition] = useTransition()
    const tEdit = useTournamentContext()
    const setError = useErrorContext()

    return (
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 w-4/5 mx-auto">
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
                                                    tEdit && listParticipants(tEdit.getTournament().id).then(tP => setDisplayP(tP))
                                                    console.log(e)
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
    )

}