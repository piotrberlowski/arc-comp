import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { RoundFormat, Tournament } from "@prisma/client";
import { format } from 'date-fns';
import Form from "next/form";

export default function TournamentCard({ tournament }: { tournament: Tournament & { format: RoundFormat } }) {
    return (
        <div className="card w-96 bg-base-300 card-sm shadow-sm">
            <div className="card-body">
                <span className="badge badge-sm badge-info">{tournament.format.name}</span>
                <div className="flex justify-between p-3 bg-secondary text-secondary-content rounded-md">
                    <h2 className="card-title text-xl">{tournament.name}</h2>
                    <span className="text-xl">{format(tournament.date, "yyyy-MM-dd")}</span>
                </div>
                <Form className="justify-end card-actions" action={`/tournament/${tournament.id}`}>
                    <button className="btn btn-success"><PencilSquareIcon width={24}/>Manage</button>
                </Form>
            </div>
        </div>
    )
}