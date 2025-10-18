import ConfirmingButton from "@/components/ConfirmingButton";
import { ArchiveBoxArrowDownIcon, HandThumbUpIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { RoundFormat, Tournament } from "@prisma/client";
import { format } from 'date-fns';
import Form from "next/form";
import { archiveTournament } from "./tournamentActions";
import { useState } from "react";

export default function TournamentCard({ tournament, onArchived }: { tournament: Tournament & { format: RoundFormat } , onArchived: (id: string) => void }) {
    const [data, setData] = useState(tournament)
    return (
        <div className="card w-96 bg-base-300 card-sm shadow-sm">
            <div className="card-body">
                
                <div className="flex justify-between">
                     <span className="badge badge-sm badge-info">{data.format.name}</span>
                     {data.isArchive && (<span className="badge badge-sm badge-warning">Archived</span>)}
                </div>
                <div className="flex justify-between p-3 bg-secondary text-secondary-content rounded-md">
                    <h2 className="card-title text-xl">{data.name}</h2>
                    <span className="text-xl">{format(data.date, "yyyy-MM-dd")}</span>
                </div>
                {!data.isArchive && (
                    <div className="justify-end card-actions">
                        <Form action={`/tournaments/${data.id}`}>
                            <button className="btn btn-success"><PencilSquareIcon width={24} />Manage</button>
                        </Form>
                        <ConfirmingButton
                            action={() => archiveTournament(data.id)
                                .then(t => {
                                    setData(t)
                                    onArchived(t.id)
                                })}
                            baseButton={{
                                className: "btn btn-warning",
                                children: (
                                    <>
                                        <ArchiveBoxArrowDownIcon width={24} />
                                        Archive
                                    </>
                                )
                            }}
                            confirmButton={{
                                className: "btn btn-warning",
                                children: (
                                    <>
                                        <HandThumbUpIcon width={24} />
                                        Confirm?
                                    </>
                                )
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}